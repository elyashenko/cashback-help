# API Documentation

## Bot Commands

### User Commands

#### `/start`
Registers a new user or welcomes back an existing user.

**Response:**
- Welcome message with bot features
- Current subscription status
- Quick tips on how to use the bot

#### `/help`
Displays help information and available commands.

**Response:**
- List of all available commands
- Example queries
- Links to documentation

#### `/search`
Initiates search mode for categories or MCC codes.

**Response:**
- Instructions on how to search
- Example queries
- Available search types

#### `/banks`
Lists all available banks in the system.

**Response:**
- List of active banks
- Bank names and codes

#### `/favorites`
Shows user's favorite categories grouped by bank.

**Response:**
- List of favorite categories
- Grouped by bank
- Usage limits (for free users)

#### `/subscription`
Displays subscription information and upgrade options.

**Response:**
- Current subscription type
- Features comparison
- Upgrade button (for free users)
- Expiry date (for pro users)

#### `/stats`
Shows user's personal statistics.

**Response:**
- Total queries count
- Queries by type breakdown
- Favorite categories count
- Subscription status

### Admin Commands

#### `/admin_add_bank`
Allows administrators to add a new bank.

**Required permissions:** Admin

**Response:**
- Instructions for adding a bank
- Expected format

#### `/admin_parse_pdf`
Allows administrators to upload and parse PDF files containing bank categories.

**Required permissions:** Admin

**Response:**
- Instructions for uploading PDF
- Expected PDF format

#### `/admin_stats`
Displays comprehensive bot statistics.

**Required permissions:** Admin

**Response:**
- Total users count
- Active users count
- Pro users count
- Total queries
- Average response time
- Popular banks

## Natural Language Queries

The bot accepts natural language queries in Russian. Examples:

### MCC Code Search
```
"какие mcc-коды для одежды в Сбере"
"mcc коды для ресторанов тинькофф"
"одежда сбербанк"
```

**Response:**
- List of matching categories
- MCC codes for each category
- Cashback rates
- Bank names

### Category by MCC Search
```
"к какой категории относится код 5722"
"категория для 4111"
"5812 тинькофф"
```

**Response:**
- Category name
- Bank name
- Cashback rate
- Related MCC codes

## Callback Queries

### `buy_pro`
Handles Pro subscription purchase.

**Triggers:**
- When user clicks "Buy Pro" button

**Response:**
- Telegram Stars invoice
- Payment form

## Payment Events

### Pre-checkout Query
Validates payment before processing.

**Response:**
- Approval or rejection
- Error message (if rejected)

### Successful Payment
Processes completed payment.

**Actions:**
1. Save payment to database
2. Upgrade user to Pro
3. Send confirmation message
4. Track metrics

**Response:**
- Success confirmation
- Subscription details
- Expiry date

## Error Responses

All errors return user-friendly messages:

### Rate Limit Exceeded
```
⏱ Вы превысили лимит запросов.

Попробуйте снова через X секунд.

💡 Pro пользователи имеют более высокие лимиты.
```

### Subscription Limit Reached
```
⚠️ Вы достигли лимита банков/категорий для Free тарифа.

Используйте /subscription для обновления до Pro.
```

### General Error
```
❌ Произошла ошибка при обработке вашего запроса.

Пожалуйста, попробуйте позже или обратитесь в поддержку.
```

## Metrics Endpoint

### GET `/metrics`
Prometheus metrics endpoint.

**Port:** 9090 (configurable via `PROMETHEUS_PORT`)

**Response Format:** Prometheus text format

**Available Metrics:**
- `bot_queries_total` - Total queries processed
- `bot_query_duration_seconds` - Query processing duration
- `bot_subscriptions_total` - Total subscriptions created
- `bot_payments_total` - Total payments processed
- `bot_active_users_total` - Total active users
- `bot_errors_total` - Total errors encountered

## Rate Limiting

### Free Users
- Window: 60 seconds
- Max requests: 10

### Pro Users
- Window: 60 seconds
- Max requests: 50

## Subscription Limits

### Free Plan
- Max banks: 4
- Max categories per bank: 4
- Monthly reset: 1st of each month

### Pro Plan
- Max banks: Unlimited
- Max categories per bank: Unlimited
- Duration: 30 days
- Price: 300 Telegram Stars

## Response Times

Target response times:
- Simple queries: < 500ms
- LLM-powered queries: < 2000ms
- Database operations: < 100ms
- PDF parsing: < 5000ms

## Caching

Cached resources:
- Banks list: 1 hour
- Categories by bank: 1 hour
- LLM parse results: 1 hour

## Webhooks (Production)

### POST `/webhook`
Telegram webhook endpoint.

**Requirements:**
- HTTPS only
- Valid Telegram signature
- Response within 5 seconds

**Setup:**
```bash
curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://yourdomain.com/webhook"}'
```

