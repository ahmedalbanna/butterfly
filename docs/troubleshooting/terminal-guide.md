}
 GET /api/admin/notifications?adminId=admin-001 200 in 109ms
[Admin Notifications] Admin admin-001 subscribed
[Admin Notifications] Admin admin-001 subscribed
prisma:query SELECT COUNT(*) AS "_count$_all" FROM (SELECT "public"."Order"."id" FROM "public"."Order" WHERE "public"."Order"."status" = $1 OFFSET $2) AS "sub"
prisma:query SELECT COUNT(*) AS "_count$_all" FROM (SELECT "public"."Order"."id" FROM "public"."Order" WHERE "public"."Order"."status" = $1 OFFSET $2) AS "sub"
prisma:query SELECT COUNT(*) AS "_count$_all" FROM (SELECT "public"."Order"."id" FROM "public"."Order" WHERE "public"."Order"."status" = $1 OFFSET $2) AS "sub"
prisma:query SELECT COUNT(*) AS "_count$_all" FROM (SELECT "public"."Order"."id" FROM "public"."Order" WHERE 1=1 OFFSET $1) AS "sub"
prisma:query SELECT COUNT(*) AS "_count$_all" FROM (SELECT "public"."Order"."id" FROM "public"."Order" WHERE "public"."Order"."status" = $1 OFFSET $2) AS "sub"
prisma:query SELECT "public"."Category"."id", "public"."Category"."name", "public"."Category"."slug", "public"."Category"."description", "public"."Category"."displayOrder", "public"."Category"."createdAt", "public"."Category"."updatedAt", COALESCE("aggr_selection_0_Product"."_aggr_count_products", 0) AS "_aggr_count_products" FROM "public"."Category" LEFT JOIN (SELECT "public"."Product"."categoryId", COUNT(*) AS "_aggr_count_products" FROM "public"."Product" WHERE 1=1 GROUP BY "public"."Product"."categoryId") AS "aggr_selection_0_Product" ON ("public"."Category"."id" = "aggr_selection_0_Product"."categoryId") WHERE 1=1 ORDER BY "public"."Category"."displayOrder" ASC OFFSET $1
prisma:query SELECT COUNT(*) AS "_count$_all" FROM (SELECT "public"."VoiceCallSession"."id" FROM "public"."VoiceCallSession" WHERE "public"."VoiceCallSession"."status" = $1 OFFSET $2) AS "sub"
prisma:query SELECT "public"."VoiceCallSession"."id", "public"."VoiceCallSession"."customerId", "public"."VoiceCallSession"."customerName", "public"."VoiceCallSession"."status", "public"."VoiceCallSession"."startedAt", "public"."VoiceCallSession"."endedAt", "public"."VoiceCallSession"."duration", "public"."VoiceCallSession"."adminId", "public"."VoiceCallSession"."adminName", "public"."VoiceCallSession"."recordingUrl", "public"."VoiceCallSession"."recordingSize" FROM "public"."VoiceCallSession" WHERE "public"."VoiceCallSession"."status" IN ($1,$2) ORDER BY "public"."VoiceCallSession"."startedAt" DESC OFFSET $3
prisma:query SELECT "public"."ActiveChatSession"."id", "public"."ActiveChatSession"."messageId", "public"."ActiveChatSession"."customerConnected", "public"."ActiveChatSession"."adminConnected", "public"."ActiveChatSession"."adminName", "public"."ActiveChatSession"."createdAt", "public"."ActiveChatSession"."lastActivity" FROM "public"."ActiveChatSession" WHERE 1=1 ORDER BY "public"."ActiveChatSession"."lastActivity" DESC OFFSET $1
prisma:query SELECT "public"."Product"."id", "public"."Product"."name", "public"."Product"."categoryId", "public"."Product"."price", "public"."Product"."description", "public"."Product"."materials", "public"."Product"."care", "public"."Product"."image", "public"."Product"."images", "public"."Product"."modelImages", "public"."Product"."video", "public"."Product"."featured", "public"."Product"."stock", "public"."Product"."createdAt", "public"."Product"."updatedAt" FROM "public"."Product" WHERE 1=1 ORDER BY "public"."Product"."featured" DESC, "public"."Product"."createdAt" DESC OFFSET $1
prisma:query SELECT "public"."CustomerMessage"."id", "public"."CustomerMessage"."customerName", "public"."CustomerMessage"."customerEmail", "public"."CustomerMessage"."customerPhone", "public"."CustomerMessage"."subject", "public"."CustomerMessage"."message", "public"."CustomerMessage"."orderId", "public"."CustomerMessage"."type", "public"."CustomerMessage"."isActive", "public"."CustomerMessage"."status", "public"."CustomerMessage"."priority", "public"."CustomerMessage"."createdAt", "public"."CustomerMessage"."updatedAt" FROM "public"."CustomerMessage" WHERE "public"."CustomerMessage"."id" IN ($1,$2,$3,$4,$5,$6) OFFSET $7
prisma:query SELECT "public"."Category"."id", "public"."Category"."name" FROM "public"."Category" WHERE "public"."Category"."id" IN ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20) OFFSET $21
prisma:query SELECT "public"."MessageReply"."id", "public"."MessageReply"."messageId", "public"."MessageReply"."sender", "public"."MessageReply"."content", "public"."MessageReply"."createdAt" FROM "public"."MessageReply" WHERE "public"."MessageReply"."messageId" IN ($1,$2,$3,$4,$5,$6) ORDER BY "public"."MessageReply"."createdAt" ASC OFFSET $7
prisma:query SELECT COUNT(*) AS "_count$_all" FROM (SELECT "public"."Order"."id" FROM "public"."Order" WHERE "public"."Order"."status" = $1 OFFSET $2) AS "sub"
prisma:query SELECT COUNT(*) AS "_count$_all" FROM (SELECT "public"."CustomerMessage"."id" FROM "public"."CustomerMessage" WHERE ("public"."CustomerMessage"."type" = $1 AND "public"."CustomerMessage"."isActive" = $2) OFFSET $3) AS "sub"
prisma:query SELECT SUM("total") AS "_sum$total" FROM (SELECT "public"."Order"."total" FROM "public"."Order" WHERE "public"."Order"."status" NOT IN ($1) OFFSET $2) AS "sub"
 GET /admin 200 in 700ms
 GET /api/admin/notifications?adminId=admin-001 200 in 929ms
TypeError: Invalid state: Controller is already closed
    at AbortSignal.<anonymous> (src/app/api/admin/notifications/route.ts:84:20)
  82 |         await subscriber.unsubscribe(channelKey);
  83 |         await subscriber.quit();
> 84 |         controller.close();
     |                    ^
  85 |         console.log(`[Admin Notifications] Admin ${adminId} disconnected`);
  86 |       });
  87 |     }, {
  code: 'ERR_INVALID_STATE'
}
 ⨯ uncaughtException: TypeError: Invalid state: Controller is already closed
    at AbortSignal.<anonymous> (src/app/api/admin/notifications/route.ts:84:20)
  82 |         await subscriber.unsubscribe(channelKey);
  83 |         await subscriber.quit();
> 84 |         controller.close();
     |                    ^
  85 |         console.log(`[Admin Notifications] Admin ${adminId} disconnected`);
  86 |       });
  87 |     }, {
  code: 'ERR_INVALID_STATE'
}
 ⨯ uncaughtException:  TypeError: Invalid state: Controller is already closed
    at AbortSignal.<anonymous> (src/app/api/admin/notifications/route.ts:84:20)
  82 |         await subscriber.unsubscribe(channelKey);
  83 |         await subscriber.quit();
> 84 |         controller.close();
     |                    ^
  85 |         console.log(`[Admin Notifications] Admin ${adminId} disconnected`);
  86 |       });
  87 |     }, {
  code: 'ERR_INVALID_STATE'
}
 GET /api/admin/notifications?adminId=admin-001 200 in 169ms
[Admin Notifications] Admin admin-001 subscribed
[Admin Notifications] Admin admin-001 subscribed
[Admin Presence] Admin Assistant (admin-001) is now away
 POST /api/admin/presence 200 in 250ms
 GET /api/admin/notifications?adminId=admin-001 200 in 655ms
TypeError: Invalid state: Controller is already closed
    at AbortSignal.<anonymous> (src/app/api/admin/notifications/route.ts:84:20)
  82 |         await subscriber.unsubscribe(channelKey);
  83 |         await subscriber.quit();
> 84 |         controller.close();
     |                    ^
  85 |         console.log(`[Admin Notifications] Admin ${adminId} disconnected`);
  86 |       });
  87 |     }, {
  code: 'ERR_INVALID_STATE'
}
 ⨯ uncaughtException: TypeError: Invalid state: Controller is already closed
    at AbortSignal.<anonymous> (src/app/api/admin/notifications/route.ts:84:20)
  82 |         await subscriber.unsubscribe(channelKey);
  83 |         await subscriber.quit();
> 84 |         controller.close();
     |                    ^
  85 |         console.log(`[Admin Notifications] Admin ${adminId} disconnected`);
  86 |       });
  87 |     }, {
  code: 'ERR_INVALID_STATE'
}
 ⨯ uncaughtException:  TypeError: Invalid state: Controller is already closed
    at AbortSignal.<anonymous> (src/app/api/admin/notifications/route.ts:84:20)
  82 |         await subscriber.unsubscribe(channelKey);
  83 |         await subscriber.quit();
> 84 |         controller.close();
     |                    ^
  85 |         console.log(`[Admin Notifications] Admin ${adminId} disconnected`);
  86 |       });
  87 |     }, {
  code: 'ERR_INVALID_STATE'
}
[Admin Presence] Admin Assistant (admin-001) is now offline
 POST /api/admin/presence 200 in 252ms