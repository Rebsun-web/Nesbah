import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(req, { params }) {
  const userId = params.user_id;

  try {
    const client = await pool.connect();

    // Get business user's application ID
    const { rows: applicationRows } = await client.query(
      `SELECT id FROM submitted_applications WHERE business_user_id = $1`,
      [userId]
    );

    if (applicationRows.length === 0) {
      client.release();
      return NextResponse.json({ error: "No submitted applications found." }, { status: 404 });
    }

    const submittedApplicationId = applicationRows[0].id;

    // Get all application offers
    const { rows: offers } = await client.query(
      `
      SELECT ao.*, u.entity_name AS bank_name
      FROM application_offers ao
      JOIN users u ON ao.submitted_by_user_id = u.user_id
      WHERE ao.submitted_application_id = $1
      ORDER BY ao.submitted_at DESC
      `,
      [submittedApplicationId]
    );

    // Get all rejection reactions
    const { rows: rejections } = await client.query(
      `
      SELECT ra.*, u.entity_name AS bank_name
      FROM rejected_applications ra
      JOIN users u ON ra.bank_user_id = u.id
      WHERE ra.submitted_application_id = $1
      `,
      [submittedApplicationId]
    );

    client.release();

    return NextResponse.json({
      submitted_application_id: submittedApplicationId,
      offers,
      rejections,
    });
  } catch (error) {
    console.error("Error fetching responses for business user:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
