# Database Schema Documentation

## Overview

Cashback-Help Bot uses PostgreSQL 15+ as its primary database. The schema is designed for optimal performance with proper indexing and relationships.

## Tables

### `users`

Stores user information and subscription details.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique user ID |
| telegram_id | BIGINT | UNIQUE, NOT NULL | Telegram user ID |
| username | VARCHAR(100) | NULL | Telegram username |
| first_name | VARCHAR(100) | NULL | User's first name |
| subscription_type | VARCHAR(10) | DEFAULT 'free' | Subscription type (free/pro) |
| subscription_expiry | TIMESTAMP | NULL | Pro subscription expiry date |
| monthly_reset_date | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last monthly reset date |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Account creation date |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update date |

**Indexes:**
- `idx_users_telegram_id` on `telegram_id`

**Triggers:**
- `update_users_updated_at` - Updates `updated_at` on every update

---

### `banks`

Stores information about banks.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique bank ID |
| name | VARCHAR(100) | NOT NULL | Bank name |
| code | VARCHAR(50) | UNIQUE, NOT NULL | Bank code (lowercase) |
| logo_url | VARCHAR(500) | NULL | URL to bank logo |
| is_active | BOOLEAN | DEFAULT true | Whether bank is active |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation date |

**Indexes:**
- `idx_banks_active` on `is_active`

---

### `cashback_categories`

Stores cashback categories and their associated MCC codes.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique category ID |
| bank_id | INTEGER | FOREIGN KEY → banks(id) | Associated bank |
| name | VARCHAR(100) | NOT NULL | Category name |
| mcc_codes | TEXT[] | NOT NULL | Array of MCC codes |
| cashback_rate | DECIMAL(5,2) | NULL | Cashback percentage |
| is_active | BOOLEAN | DEFAULT true | Whether category is active |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation date |

**Constraints:**
- UNIQUE(bank_id, name)

**Indexes:**
- `idx_categories_active` on `is_active`
- `idx_categories_bank_id` on `bank_id`
- `idx_mcc_codes` (GIN) on `mcc_codes` - For fast array searches

---

### `user_favorite_categories`

Stores user's favorite categories.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique favorite ID |
| user_id | INTEGER | FOREIGN KEY → users(id) | User who favorited |
| bank_id | INTEGER | FOREIGN KEY → banks(id) | Associated bank |
| category_id | INTEGER | FOREIGN KEY → cashback_categories(id) | Favorited category |
| added_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | When added |

**Constraints:**
- UNIQUE(user_id, bank_id, category_id)

**Indexes:**
- `idx_favorites_user_id` on `user_id`

---

### `payment_history`

Stores payment transactions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique payment ID |
| user_id | INTEGER | FOREIGN KEY → users(id) | User who paid |
| transaction_id | VARCHAR(100) | UNIQUE | Telegram payment charge ID |
| amount | INTEGER | NOT NULL | Amount in Telegram Stars |
| status | VARCHAR(20) | DEFAULT 'pending' | Payment status |
| subscription_type | VARCHAR(10) | NULL | Type of subscription purchased |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Payment date |

**Valid status values:**
- `pending`
- `completed`
- `failed`
- `refunded`

**Indexes:**
- `idx_payment_user_id` on `user_id`

---

### `query_logs`

Stores analytics data for user queries.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique log ID |
| user_id | INTEGER | FOREIGN KEY → users(id) | User who queried |
| query_text | TEXT | NULL | Original query text |
| query_type | VARCHAR(50) | NOT NULL | Type of query |
| bank_name | VARCHAR(100) | NULL | Bank mentioned in query |
| response_time_ms | INTEGER | NOT NULL | Response time in milliseconds |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Query date |

**Query types:**
- `mcc_search` - Search for category by MCC code
- `category_search` - Search for MCC codes by category
- `favorite_view` - View favorite categories

**Indexes:**
- `idx_query_logs_user_id` on `user_id`
- `idx_query_logs_created_at` on `created_at`

---

## Relationships

```
users (1) ----< (N) user_favorite_categories
banks (1) ----< (N) cashback_categories
banks (1) ----< (N) user_favorite_categories
cashback_categories (1) ----< (N) user_favorite_categories
users (1) ----< (N) payment_history
users (1) ----< (N) query_logs
```

## ER Diagram

```
┌─────────────┐
│   users     │
├─────────────┤
│ id (PK)     │──┐
│ telegram_id │  │
│ username    │  │
│ first_name  │  │
│ sub_type    │  │
│ sub_expiry  │  │
└─────────────┘  │
                 │
      ┌──────────┴──────────┬──────────────────┐
      │                     │                  │
      ▼                     ▼                  ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│user_favorite │   │payment_hist  │   │ query_logs   │
│ _categories  │   ├──────────────┤   ├──────────────┤
├──────────────┤   │ id (PK)      │   │ id (PK)      │
│ id (PK)      │   │ user_id (FK) │   │ user_id (FK) │
│ user_id (FK) │   │ trans_id     │   │ query_text   │
│ bank_id (FK) │   │ amount       │   │ query_type   │
│ cat_id (FK)  │   │ status       │   │ bank_name    │
└──────────────┘   └──────────────┘   └──────────────┘
      │
      │
      ├─────────────────┐
      │                 │
      ▼                 ▼
┌─────────────┐   ┌─────────────┐
│   banks     │   │  cashback   │
├─────────────┤   │ categories  │
│ id (PK)     │──<├─────────────┤
│ name        │   │ id (PK)     │
│ code        │   │ bank_id(FK) │
│ logo_url    │   │ name        │
│ is_active   │   │ mcc_codes[] │
└─────────────┘   │ cashback_%  │
                  └─────────────┘
```

## Migrations

### Running Migrations

```bash
# Apply all migrations
psql cashback_bot < src/database/migrations/001_initial_schema.sql

# Or using psql
psql -U postgres -d cashback_bot -f src/database/migrations/001_initial_schema.sql
```

### Creating New Migrations

1. Create a new file in `src/database/migrations/`
2. Name it with incrementing number: `002_your_migration_name.sql`
3. Write SQL for both UP and DOWN migrations
4. Test thoroughly before applying to production

## Seeding Data

```bash
# Run seed script
npm run seed
```

This will populate the database with:
- 2 sample banks (Sberbank, Tinkoff)
- Multiple cashback categories for each bank
- MCC codes for each category

## Performance Considerations

### Indexes

The schema includes several indexes for optimal performance:

1. **GIN Index on mcc_codes** - Enables fast array searches
   ```sql
   CREATE INDEX idx_mcc_codes ON cashback_categories USING GIN (mcc_codes);
   ```

2. **B-tree Indexes** - For foreign keys and frequently queried columns
   ```sql
   CREATE INDEX idx_users_telegram_id ON users(telegram_id);
   CREATE INDEX idx_favorites_user_id ON user_favorite_categories(user_id);
   ```

### Query Optimization

- Always use prepared statements
- Limit result sets with LIMIT clauses
- Use JOIN instead of multiple queries
- Leverage caching for frequently accessed data

## Backup & Restore

### Backup

```bash
# Full database backup
pg_dump cashback_bot > backup.sql

# Compressed backup
pg_dump cashback_bot | gzip > backup.sql.gz

# Backup specific tables
pg_dump -t users -t banks cashback_bot > backup_tables.sql
```

### Restore

```bash
# Restore from backup
psql cashback_bot < backup.sql

# Restore compressed backup
gunzip -c backup.sql.gz | psql cashback_bot
```

## Maintenance

### Vacuum

Run periodically to optimize database:

```sql
-- Analyze and optimize all tables
VACUUM ANALYZE;

-- Vacuum specific table
VACUUM ANALYZE cashback_categories;
```

### Reindex

Rebuild indexes if needed:

```sql
-- Reindex specific index
REINDEX INDEX idx_mcc_codes;

-- Reindex all indexes on a table
REINDEX TABLE cashback_categories;
```

## Security

### User Permissions

Create a dedicated database user with limited permissions:

```sql
-- Create user
CREATE USER cashback_bot_user WITH PASSWORD 'secure_password';

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO cashback_bot_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO cashback_bot_user;
```

### Sensitive Data

- Never store API keys or tokens in database
- Use environment variables for secrets
- Implement proper access controls
- Regular security audits

## Monitoring

Track these metrics:
- Table sizes
- Index usage
- Query performance
- Connection pool status
- Lock contention

```sql
-- Check table sizes
SELECT 
  tablename,
  pg_size_pretty(pg_total_relation_size(tablename::regclass)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(tablename::regclass) DESC;

-- Check index usage
SELECT 
  indexrelname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

