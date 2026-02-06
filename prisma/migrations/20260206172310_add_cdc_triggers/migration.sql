-- Change Data Capture (CDC) Triggers for Real-Time Synchronization
-- This migration adds PostgreSQL triggers to emit NOTIFY events for data changes

-- =====================================================
-- 1. Create notification function for CDC
-- =====================================================
CREATE OR REPLACE FUNCTION notify_data_change()
RETURNS TRIGGER AS $$
DECLARE
  payload JSON;
  channel TEXT;
BEGIN
  -- Determine channel based on table name
  channel := 'cdc:' || TG_TABLE_NAME;
  
  -- Build payload with operation type and data
  IF (TG_OP = 'DELETE') THEN
    payload := json_build_object(
      'operation', TG_OP,
      'table', TG_TABLE_NAME,
      'timestamp', EXTRACT(EPOCH FROM NOW())::BIGINT * 1000,
      'old', row_to_json(OLD)
    );
  ELSIF (TG_OP = 'UPDATE') THEN
    payload := json_build_object(
      'operation', TG_OP,
      'table', TG_TABLE_NAME,
      'timestamp', EXTRACT(EPOCH FROM NOW())::BIGINT * 1000,
      'old', row_to_json(OLD),
      'new', row_to_json(NEW)
    );
  ELSIF (TG_OP = 'INSERT') THEN
    payload := json_build_object(
      'operation', TG_OP,
      'table', TG_TABLE_NAME,
      'timestamp', EXTRACT(EPOCH FROM NOW())::BIGINT * 1000,
      'new', row_to_json(NEW)
    );
  END IF;
  
  -- Emit notification
  PERFORM pg_notify(channel, payload::TEXT);
  
  -- Also emit to generic channel for all changes
  PERFORM pg_notify('cdc:all', payload::TEXT);
  
  -- Return appropriate row
  IF (TG_OP = 'DELETE') THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 2. Add triggers to Product table
-- =====================================================
DROP TRIGGER IF EXISTS product_cdc_trigger ON "Product";
CREATE TRIGGER product_cdc_trigger
  AFTER INSERT OR UPDATE OR DELETE ON "Product"
  FOR EACH ROW
  EXECUTE FUNCTION notify_data_change();

-- =====================================================
-- 3. Add triggers to Order table
-- =====================================================
DROP TRIGGER IF EXISTS order_cdc_trigger ON "Order";
CREATE TRIGGER order_cdc_trigger
  AFTER INSERT OR UPDATE OR DELETE ON "Order"
  FOR EACH ROW
  EXECUTE FUNCTION notify_data_change();

-- =====================================================
-- 4. Add triggers to OrderItem table
-- =====================================================
DROP TRIGGER IF EXISTS orderitem_cdc_trigger ON "OrderItem";
CREATE TRIGGER orderitem_cdc_trigger
  AFTER INSERT OR UPDATE OR DELETE ON "OrderItem"
  FOR EACH ROW
  EXECUTE FUNCTION notify_data_change();

-- =====================================================
-- 5. Add triggers to CustomerMessage table
-- =====================================================
DROP TRIGGER IF EXISTS customermessage_cdc_trigger ON "CustomerMessage";
CREATE TRIGGER customermessage_cdc_trigger
  AFTER INSERT OR UPDATE OR DELETE ON "CustomerMessage"
  FOR EACH ROW
  EXECUTE FUNCTION notify_data_change();

-- =====================================================
-- 6. Add triggers to MessageReply table
-- =====================================================
DROP TRIGGER IF EXISTS messagereply_cdc_trigger ON "MessageReply";
CREATE TRIGGER messagereply_cdc_trigger
  AFTER INSERT OR UPDATE OR DELETE ON "MessageReply"
  FOR EACH ROW
  EXECUTE FUNCTION notify_data_change();

-- =====================================================
-- 7. Add triggers to VoiceCallSession table
-- =====================================================
DROP TRIGGER IF EXISTS voicecallsession_cdc_trigger ON "VoiceCallSession";
CREATE TRIGGER voicecallsession_cdc_trigger
  AFTER INSERT OR UPDATE OR DELETE ON "VoiceCallSession"
  FOR EACH ROW
  EXECUTE FUNCTION notify_data_change();

-- =====================================================
-- 8. Add triggers to ActiveChatSession table
-- =====================================================
DROP TRIGGER IF EXISTS activechatsession_cdc_trigger ON "ActiveChatSession";
CREATE TRIGGER activechatsession_cdc_trigger
  AFTER INSERT OR UPDATE OR DELETE ON "ActiveChatSession"
  FOR EACH ROW
  EXECUTE FUNCTION notify_data_change();

-- =====================================================
-- 9. Add triggers to Category table
-- =====================================================
DROP TRIGGER IF EXISTS category_cdc_trigger ON "Category";
CREATE TRIGGER category_cdc_trigger
  AFTER INSERT OR UPDATE OR DELETE ON "Category"
  FOR EACH ROW
  EXECUTE FUNCTION notify_data_change();

-- =====================================================
-- 10. Add triggers to SocialMediaPost table
-- =====================================================
DROP TRIGGER IF EXISTS socialmediapost_cdc_trigger ON "SocialMediaPost";
CREATE TRIGGER socialmediapost_cdc_trigger
  AFTER INSERT OR UPDATE OR DELETE ON "SocialMediaPost"
  FOR EACH ROW
  EXECUTE FUNCTION notify_data_change();

-- =====================================================
-- Comments
-- =====================================================
COMMENT ON FUNCTION notify_data_change() IS 'CDC function that emits NOTIFY events for INSERT/UPDATE/DELETE operations';
COMMENT ON TRIGGER product_cdc_trigger ON "Product" IS 'CDC trigger for Product table';
COMMENT ON TRIGGER order_cdc_trigger ON "Order" IS 'CDC trigger for Order table';
COMMENT ON TRIGGER orderitem_cdc_trigger ON "OrderItem" IS 'CDC trigger for OrderItem table';
COMMENT ON TRIGGER customermessage_cdc_trigger ON "CustomerMessage" IS 'CDC trigger for CustomerMessage table';
COMMENT ON TRIGGER messagereply_cdc_trigger ON "MessageReply" IS 'CDC trigger for MessageReply table';
COMMENT ON TRIGGER voicecallsession_cdc_trigger ON "VoiceCallSession" IS 'CDC trigger for VoiceCallSession table';
COMMENT ON TRIGGER activechatsession_cdc_trigger ON "ActiveChatSession" IS 'CDC trigger for ActiveChatSession table';
COMMENT ON TRIGGER category_cdc_trigger ON "Category" IS 'CDC trigger for Category table';
COMMENT ON TRIGGER socialmediapost_cdc_trigger ON "SocialMediaPost" IS 'CDC trigger for SocialMediaPost table';
