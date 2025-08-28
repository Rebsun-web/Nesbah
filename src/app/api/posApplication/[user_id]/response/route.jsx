import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(req, { params }) {
  const userId = (await params).user_id;
  let client = null;

  try {
    client = await pool.connectWithRetry();

    // Get business user's application ID directly from pos_application
    const { rows: applicationRows } = await client.query(
      `SELECT application_id, status, offers_count, purchased_by FROM pos_application WHERE user_id = $1 ORDER BY submitted_at DESC LIMIT 1`,
      [userId]
    );

    if (applicationRows.length === 0) {
      return NextResponse.json({ error: "No submitted applications found." }, { status: 404 });
    }

    const application = applicationRows[0];
    const applicationId = application.application_id;

    // Get all application offers using application_offers table
    const { rows: offers } = await client.query(
      `
      SELECT 
        ao.*,
        u.entity_name AS bank_name,
        bu.contact_person AS bank_contact_person,
        bu.contact_person_number AS bank_contact_number
      FROM application_offers ao
      JOIN bank_users bu ON ao.bank_user_id = bu.user_id
      JOIN users u ON bu.user_id = u.user_id
      WHERE ao.submitted_application_id = $1
      ORDER BY ao.submitted_at DESC
      `,
      [applicationId]
    );

    return NextResponse.json({
      application_id: applicationId,
      offers,
      application_status: application.status,
      offers_count: application.offers_count || 0,
      purchased_by: application.purchased_by || []
    });
  } catch (error) {
    console.error("Error fetching responses for business user:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    if (client) {
      client.release();
    }
  }
}
