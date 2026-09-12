Kalau yang kamu maksud **standard response JSON untuk REST API backend yang umum dipakai secara internasional**, pola yang aman dan scalable biasanya seperti ini:

### 1. Success — Single Data

```json
{
  "success": true,
  "data": {
    "id": "123",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "message": "User retrieved successfully"
}
```

### 2. Success — Collection / List

```json
{
  "success": true,
  "data": [
    {
      "id": "123",
      "name": "John Doe"
    },
    {
      "id": "124",
      "name": "Jane Doe"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  },
  "message": "Users retrieved successfully"
}
```

### 3. Error

```json
{
  "success": false,
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "User not found",
    "details": null
  }
}
```

### 4. Validation Error

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": {
      "email": [
        "Email is required"
      ],
      "password": [
        "Password must be at least 8 characters"
      ]
    }
  }
}
```

### 5. Internal Server Error

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "An unexpected error occurred",
    "details": null
  }
}
```

### HTTP Status Code

| Status | Penggunaan                  |
| ------ | --------------------------- |
| `200`  | Success / GET / PUT         |
| `201`  | Resource berhasil dibuat    |
| `204`  | Success tanpa response body |
| `400`  | Bad request                 |
| `401`  | Unauthorized                |
| `403`  | Forbidden                   |
| `404`  | Resource tidak ditemukan    |
| `409`  | Conflict                    |
| `422`  | Validation error            |
| `429`  | Too many requests           |
| `500`  | Internal server error       |

**Kalau untuk production**, saya biasanya menyarankan struktur inti:

```text
{
  success,
  data,
  error,
  pagination,
  message
}
```

Tapi **jangan memaksakan semua field selalu muncul**. Misalnya response sukses tidak perlu punya `error: null`.

Kalau kamu mau, saya juga bisa kasih **struktur response backend yang benar-benar production-grade** (REST API + pagination + validation + error code + trace ID + TypeScript interface).
