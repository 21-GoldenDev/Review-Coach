import "../server/load-env";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  await pool.query(
    "ALTER TABLE coaches ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false",
  );
  await pool.query("UPDATE coaches SET is_featured = false");
  console.log("Added coaches.is_featured column (if missing) and cleared all featured flags.");
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
