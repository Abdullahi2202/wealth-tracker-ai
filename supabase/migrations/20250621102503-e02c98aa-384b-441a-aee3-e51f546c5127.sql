
CREATE OR REPLACE FUNCTION increment_wallet_balance(user_id_param uuid, topup_amount_cents bigint)
RETURNS void AS $$
BEGIN
  -- Convert cents to dollars and update wallet balance
  UPDATE wallets
  SET balance = balance + (topup_amount_cents / 100.0),
      updated_at = now()
  WHERE user_id = user_id_param;
  
  -- If no wallet exists, create one
  IF NOT FOUND THEN
    INSERT INTO wallets (user_id, balance, updated_at)
    VALUES (user_id_param, topup_amount_cents / 100.0, now());
  END IF;
END;
$$ LANGUAGE plpgsql;
