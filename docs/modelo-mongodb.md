# Modelo MongoDB propuesto

La app va a tener usuarios, por eso el modelo separa identidad de datos financieros.

## Coleccion `users`

Guarda solo datos de cuenta:

```json
{
  "_id": "ObjectId",
  "email": "usuario@email.com",
  "password_hash": "hash-generado-en-backend",
  "display_name": "Nicolas",
  "is_active": true,
  "created_at": "2026-06-03T00:00:00Z",
  "updated_at": "2026-06-03T00:00:00Z"
}
```

Motivo: login, permisos y estado del usuario no deberian mezclarse con gastos. Cuando agreguemos registro, aca se guarda el hash de password, nunca la password plana.

## Coleccion `finance_profiles`

Guarda el estado financiero de un usuario:

```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId-del-usuario",
  "salary": 1000000,
  "banks": [
    {
      "id": "uuid",
      "name": "Banco Provincia",
      "cards": [
        {
          "id": "uuid",
          "name": "Visa",
          "accent": "#2563eb"
        }
      ]
    }
  ],
  "card_expenses": [
    {
      "id": "uuid",
      "card_id": "uuid",
      "origin": "Netflix",
      "amount": 7000,
      "savings": 0,
      "installments": 0,
      "is_fixed": true,
      "fixed_category": "subscriptions"
    }
  ],
  "subscription_expenses": [],
  "activity_expenses": [],
  "department_expenses": [],
  "extra_expenses": [],
  "payment_registry": [
    {
      "year": 2026,
      "month": 6,
      "service_id": "card:uuid",
      "paid": true
    }
  ],
  "created_at": "2026-06-03T00:00:00Z",
  "updated_at": "2026-06-03T00:00:00Z"
}
```

Motivo: MongoDB funciona bien con documentos que representan un estado agregado. Este documento evita hacer muchas consultas para reconstruir la pantalla principal.

## Por que no guardar todo en `users`

Separarlo evita que el documento de usuario crezca con datos operativos. Tambien permite, mas adelante, agregar perfiles compartidos, backups por usuario, auditoria o importaciones sin tocar autenticacion.

## Indices recomendados

```js
db.users.createIndex({ email: 1 }, { unique: true })
db.finance_profiles.createIndex({ user_id: 1 }, { unique: true })
```

Motivo: email debe ser unico para login, y por ahora cada usuario tendria un solo perfil financiero.
