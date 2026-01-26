# Brand Creation JSON Examples

This directory contains JSON examples for creating brands via the API.

## Files

### 1. `create-brand-client.json`
**Endpoint**: `POST /api/brands` (Client Backend)
- For brand owners creating their own brand
- Requires authentication (JWT token)
- `logo_url` is required
- `name` is required
- `status` defaults to "pending"
- `is_featured` defaults to false
- `ownerId` is automatically set from authenticated user

**Usage**:
```bash
curl -X POST http://localhost:5000/api/brands \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d @create-brand-client.json
```

### 2. `create-brand-admin.json`
**Endpoint**: `POST /api/admin/brands` (Admin Backend)
- For admins creating brands
- Can set `is_featured` and `status` directly
- `ownerId` can be null (admin-created brands)
- No authentication required (or admin authentication, depending on your setup)

**Usage**:
```bash
curl -X POST http://localhost:5001/api/admin/brands \
  -H "Content-Type: application/json" \
  -d @create-brand-admin.json
```

### 3. `create-brand-minimal.json`
**Endpoint**: `POST /api/brands` or `POST /api/admin/brands`
- Minimal required fields only
- Only `name` and `logo_url` are required
- All other fields are optional

**Usage**:
```bash
curl -X POST http://localhost:5000/api/brands \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d @create-brand-minimal.json
```

### 4. `create-brand-with-base64.json`
**Endpoint**: `POST /api/brands` or `POST /api/admin/brands`
- Example using base64 encoded image
- `logo_url` can be either HTTP/HTTPS URL or data URL (base64)

**Usage**:
```bash
curl -X POST http://localhost:5000/api/brands \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d @create-brand-with-base64.json
```

## Field Descriptions

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| `name` | String | ✅ Yes | Brand name (unique) | Must be unique |
| `logo_url` | String | ✅ Yes | Logo URL or base64 | HTTP/HTTPS URL or data URL |
| `description` | String | ❌ No | Brand description | - |
| `location` | String | ❌ No | Brand location | - |
| `website` | String | ❌ No | Website URL | Must be valid URL if provided |
| `instagram` | String | ❌ No | Instagram handle or URL | Username (@username) or URL |
| `facebook` | String | ❌ No | Facebook page URL | Must be valid URL if provided |
| `phone` | String | ❌ No | Contact phone | - |
| `email` | String | ❌ No | Contact email | Must be valid email if provided |
| `is_featured` | Boolean | ❌ No | Featured brand flag | Default: false |
| `status` | String | ❌ No | Brand status | Enum: 'pending', 'approved', 'rejected' |

## Notes

- **Logo URL**: Can be either:
  - HTTP/HTTPS URL: `https://example.com/logo.png`
  - Base64 data URL: `data:image/png;base64,iVBORw0KGgo...`

- **Instagram**: Can be either:
  - Username: `@username` or `username`
  - Full URL: `https://instagram.com/username`

- **Phone**: For Tunisian numbers, use format: `+216XXXXXXXX`

- **Status**: 
  - Client backend: Always defaults to "pending" (cannot be set by brand owner)
  - Admin backend: Can set to "approved", "pending", or "rejected"

- **Unique Constraints**:
  - Brand name must be unique across all brands
  - Each brand owner can only have one brand (enforced by sparse unique index on `ownerId`)

## Response Format

**Success (201 Created)**:
```json
{
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Example Brand",
    "logo_url": "https://example.com/logo.png",
    "status": "pending",
    "is_featured": false,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    ...
  }
}
```

**Error (400/409)**:
```json
{
  "error": {
    "message": "Brand name already exists"
  }
}
```








