#!/bin/bash

# Production Deployment Script for Nesbah
# This script handles secure deployment with monitoring and backup

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="nesbah"
DEPLOYMENT_ENV="production"
BACKUP_DIR="/backups"
LOG_DIR="/logs"
SSL_DIR="/ssl"

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        error "This script should not be run as root"
    fi
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed"
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed"
    fi
    
    # Check environment file
    if [ ! -f ".env.production" ]; then
        error "Production environment file (.env.production) not found"
    fi
    
    # Check SSL certificates
    if [ ! -f "nginx/ssl/nesbah.com.crt" ] || [ ! -f "nginx/ssl/nesbah.com.key" ]; then
        warn "SSL certificates not found. Please ensure they are in nginx/ssl/"
    fi
    
    log "Prerequisites check completed"
}

# Create necessary directories
create_directories() {
    log "Creating necessary directories..."
    
    mkdir -p $BACKUP_DIR
    mkdir -p $LOG_DIR
    mkdir -p $SSL_DIR
    mkdir -p monitoring/grafana/dashboards
    mkdir -p monitoring/grafana/datasources
    
    log "Directories created"
}

# Backup current deployment
backup_current() {
    log "Creating backup of current deployment..."
    
    BACKUP_NAME="${PROJECT_NAME}_backup_$(date +%Y%m%d_%H%M%S)"
    BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"
    
    mkdir -p $BACKUP_PATH
    
    # Backup database
    if docker-compose -f docker-compose.production.yml exec -T postgres pg_dump -U nesbah_user nesbah > $BACKUP_PATH/database.sql 2>/dev/null; then
        log "Database backup created"
    else
        warn "Database backup failed (this is normal for first deployment)"
    fi
    
    # Backup configuration files
    cp -r monitoring/ $BACKUP_PATH/
    cp docker-compose.production.yml $BACKUP_PATH/
    cp .env.production $BACKUP_PATH/
    
    # Compress backup
    tar -czf $BACKUP_PATH.tar.gz -C $BACKUP_DIR $BACKUP_NAME
    rm -rf $BACKUP_PATH
    
    log "Backup completed: $BACKUP_PATH.tar.gz"
}

# Security checks
security_checks() {
    log "Performing security checks..."
    
    # Check for default passwords
    if grep -q "YOUR_SECURE_PASSWORD" .env.production; then
        error "Default passwords detected in .env.production. Please update all passwords."
    fi
    
    if grep -q "YOUR_SUPER_SECURE_JWT_SECRET" .env.production; then
        error "Default JWT secret detected. Please update JWT_SECRET."
    fi
    
    if grep -q "YOUR_SUPER_SECURE_MFA_SECRET" .env.production; then
        error "Default MFA secret detected. Please update MFA_SECRET."
    fi
    
    # Check file permissions
    if [ "$(stat -c %a .env.production)" != "600" ]; then
        warn "Setting secure permissions on .env.production"
        chmod 600 .env.production
    fi
    
    # Check SSL certificate expiry
    if [ -f "nginx/ssl/nesbah.com.crt" ]; then
        EXPIRY=$(openssl x509 -enddate -noout -in nginx/ssl/nesbah.com.crt | cut -d= -f2)
        EXPIRY_DATE=$(date -d "$EXPIRY" +%s)
        CURRENT_DATE=$(date +%s)
        DAYS_LEFT=$(( ($EXPIRY_DATE - $CURRENT_DATE) / 86400 ))
        
        if [ $DAYS_LEFT -lt 30 ]; then
            warn "SSL certificate expires in $DAYS_LEFT days"
        fi
    fi
    
    log "Security checks completed"
}

# Stop current services
stop_services() {
    log "Stopping current services..."
    
    if docker-compose -f docker-compose.production.yml down; then
        log "Services stopped"
    else
        warn "Some services may not have been running"
    fi
}

# Build and start services
deploy_services() {
    log "Building and starting services..."
    
    # Build images
    docker-compose -f docker-compose.production.yml build --no-cache
    
    # Start services
    docker-compose -f docker-compose.production.yml up -d
    
    log "Services deployed"
}

# Wait for services to be healthy
wait_for_health() {
    log "Waiting for services to be healthy..."
    
    # Wait for main application
    for i in {1..30}; do
        if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
            log "Main application is healthy"
            break
        fi
        
        if [ $i -eq 30 ]; then
            error "Main application failed to become healthy"
        fi
        
        sleep 2
    done
    
    # Wait for database
    for i in {1..30}; do
        if docker-compose -f docker-compose.production.yml exec -T postgres pg_isready -U nesbah_user -d nesbah > /dev/null 2>&1; then
            log "Database is healthy"
            break
        fi
        
        if [ $i -eq 30 ]; then
            error "Database failed to become healthy"
        fi
        
        sleep 2
    done
    
    log "All services are healthy"
}

# Run database migrations
run_migrations() {
    log "Running database migrations..."
    
    # Run admin migrations
    docker-compose -f docker-compose.production.yml exec -T nesbah-app npm run admin-migrate
    
    log "Migrations completed"
}

# Setup monitoring
setup_monitoring() {
    log "Setting up monitoring..."
    
    # Wait for Prometheus to be ready
    sleep 10
    
    # Check if Prometheus is accessible
    if curl -f http://localhost:9090/-/healthy > /dev/null 2>&1; then
        log "Prometheus is running"
    else
        warn "Prometheus health check failed"
    fi
    
    # Check if Grafana is accessible
    if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
        log "Grafana is running"
    else
        warn "Grafana health check failed"
    fi
    
    log "Monitoring setup completed"
}

# Performance optimization
optimize_performance() {
    log "Optimizing performance..."
    
    # Enable gzip compression
    docker-compose -f docker-compose.production.yml exec -T nginx nginx -s reload
    
    # Clear application cache
    docker-compose -f docker-compose.production.yml exec -T nesbah-app rm -rf .next/cache
    
    log "Performance optimization completed"
}

# Final health check
final_health_check() {
    log "Performing final health check..."
    
    # Check main application
    if ! curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        error "Main application health check failed"
    fi
    
    # Check admin panel
    if ! curl -f http://localhost:3000/admin > /dev/null 2>&1; then
        warn "Admin panel health check failed"
    fi
    
    # Check background jobs
    if ! docker-compose -f docker-compose.production.yml exec -T nesbah-background-jobs pgrep -f "start-background-jobs" > /dev/null 2>&1; then
        warn "Background jobs health check failed"
    fi
    
    log "Final health check completed"
}

# Display deployment info
display_info() {
    log "Deployment completed successfully!"
    echo
    echo -e "${BLUE}=== Deployment Information ===${NC}"
    echo -e "Application URL: ${GREEN}https://nesbah.com${NC}"
    echo -e "Admin Panel: ${GREEN}https://nesbah.com/admin${NC}"
    echo -e "Grafana Dashboard: ${GREEN}http://localhost:3001${NC}"
    echo -e "Prometheus: ${GREEN}http://localhost:9090${NC}"
    echo -e "Kibana: ${GREEN}http://localhost:5601${NC}"
    echo
    echo -e "${YELLOW}Important:${NC}"
    echo -e "1. Update DNS records to point to this server"
    echo -e "2. Configure SSL certificates in nginx/ssl/"
    echo -e "3. Update monitoring webhook URLs"
    echo -e "4. Test all functionality"
    echo
}

# Main deployment function
main() {
    log "Starting production deployment for $PROJECT_NAME..."
    
    check_root
    check_prerequisites
    create_directories
    backup_current
    security_checks
    stop_services
    deploy_services
    wait_for_health
    run_migrations
    setup_monitoring
    optimize_performance
    final_health_check
    display_info
    
    log "Production deployment completed successfully!"
}

# Run main function
main "$@"
