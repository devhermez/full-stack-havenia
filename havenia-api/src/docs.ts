// src/docs.ts
import swaggerJsdoc from "swagger-jsdoc";

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Havenia API",
      version: "1.0.0",
      description: "Havenia (IslandSync/AquaVibe/Dive & Dine) public API",
    },
    servers: [
      { url: "http://localhost:4000", description: "Local" },
      // later add prod: { url: "https://api.havenia.com", description: "Prod" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        // Reuse these in responses/requestBodies
        User: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            email: { type: "string", format: "email" },
            name: { type: "string", nullable: true },
            role: { type: "string", enum: ["user", "staff", "admin"], nullable: true },
            created_at: { type: "string", format: "date-time", nullable: true },
          },
        },
        MenuItem: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string" },
            description: { type: "string", nullable: true },
            price: { type: "string", description: "numeric as string" },
            in_stock: { type: "boolean" },
            image_url: { type: "string", nullable: true },
            prep_minutes: { type: "integer", nullable: true },
            category: { type: "string", nullable: true },
            property_id: { type: "string", format: "uuid", nullable: true },
          },
        },
        OrderItem: {
          type: "object",
          properties: {
            menu_item_id: { type: "string", format: "uuid" },
            qty: { type: "integer" },
            unit_price: { type: "number" },
            notes: { type: "string", nullable: true },
            name: { type: "string", nullable: true },
          },
        },
        Order: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            status: { type: "string", enum: ["pending", "confirmed", "canceled"] },
            delivery_type: { type: "string", enum: ["pickup", "delivery"] },
            scheduled_ts: { type: "string", format: "date-time", nullable: true },
            subtotal: { type: "number" },
            delivery_fee: { type: "number" },
            discount: { type: "number" },
            total: { type: "number" },
            payment_status: { type: "string", enum: ["unpaid", "paid", "failed"], nullable: true },
            items: { type: "array", items: { $ref: "#/components/schemas/OrderItem" } },
            created_at: { type: "string", format: "date-time", nullable: true },
          },
        },
        Reservation: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            status: { type: "string", enum: ["pending", "confirmed", "canceled"] },
            start_date: { type: "string", format: "date" },
            end_date: { type: "string", format: "date" },
            room_id: { type: "string", format: "uuid" },
            property_id: { type: "string", format: "uuid" },
            created_at: { type: "string", format: "date-time", nullable: true },
            nights: { type: "integer", nullable: true },
            est_total: { type: "number", nullable: true },
          },
        },
        Address: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            user_id: { type: "string", format: "uuid" },
            label: { type: "string" },
            line1: { type: "string" },
            line2: { type: "string", nullable: true },
            city: { type: "string" },
            region: { type: "string" },
            postal_code: { type: "string" },
            is_default: { type: "boolean" },
          },
        },
        Error: {
          type: "object",
          properties: {
            error: {
              type: "object",
              properties: {
                code: { type: "string", nullable: true },
                message: { type: "string" },
                request_id: { type: "string", nullable: true },
                details: { type: "object", nullable: true },
              },
            },
          },
        },
      },
    },
    tags: [
      { name: "Auth" },
      { name: "Menu" },
      { name: "Orders" },
      { name: "Payments" },
      { name: "Rooms" },
      { name: "Activities" },
      { name: "Addresses" },
      { name: "Admin" },
    ],
  },
  // Pick up JSDoc @openapi blocks from your route/controller files:
  apis: ["./src/**/*.ts"],
});