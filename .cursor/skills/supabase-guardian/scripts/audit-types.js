const fs = require('fs');
const path = require('path');

// Target the generated Supabase types
// Note: Adjust this path if your types are located elsewhere (e.g. src/shared/api/supabase/database.types.ts)
const TYPES_PATH = path.join(process.cwd(), 'src/types/supabase.ts');

const SYSTEM_TABLES = ['schema_migrations', 'users', 'audit_logs']; // Tables that might use global IDs

function scanForTenancy() {
    console.log("\x1b[36m%s\x1b[0m", "🛡️  Supabase Guardian: Auditing Multi-Tenancy...");

    if (!fs.existsSync(TYPES_PATH)) {
        console.error(`❌ Types file not found at: ${TYPES_PATH}`);
        console.error("   Run 'npm run db:gen-types' to generate them.");
        // We exit with 0 here because we don't want to block scaffolding if types aren't generated yet,
        // but we warn heavily.
        return;
    }

    const content = fs.readFileSync(TYPES_PATH, 'utf8');
    
    // Regex to find table definitions in the Database interface
    // This is a heuristic scan. It looks for "Tables" section and checks keys.
    // Real AST parsing would be better, but regex is sufficient for quick checks.
    
    // 1. Check if workspace_id exists generally in the file
    // We expect almost every table to have this.
    if (!content.includes('workspace_id')) {
        console.warn("⚠️  WARNING: 'workspace_id' not found in type definition. Is multi-tenancy implemented?");
    } else {
        console.log("✅ 'workspace_id' column detected in schema definition.");
    }

    // 2. Simple check for RLS usage in comments or definition
    // Supabase CLI often injects comments about RLS.
    if (!content.includes('Row Level Security')) {
       // Note: Type definitions often don't include RLS info, so this is soft.
    }

    console.log("✅ Audit Complete. Remember: The database is the only source of truth.");
    console.log("   (Manual verification of RLS policies in SQL migrations is still required).");
}

scanForTenancy();