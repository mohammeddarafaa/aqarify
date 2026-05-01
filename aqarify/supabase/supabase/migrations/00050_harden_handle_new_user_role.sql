-- Prevent public signup role escalation.
-- Any self-signup user is always created as customer.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_full_name text;
  v_slug text;
  v_tenant_id uuid;
BEGIN
  v_full_name := COALESCE(
    NULLIF(trim(NEW.raw_user_meta_data->>'full_name'), ''),
    split_part(NEW.email, '@', 1)
  );

  v_slug := NULLIF(lower(trim(NEW.raw_user_meta_data->>'tenant_slug')), '');

  IF v_slug IS NOT NULL THEN
    SELECT t.id
    INTO v_tenant_id
    FROM public.tenants t
    WHERE t.slug = v_slug
      AND t.status IN ('active', 'read_only', 'trial')
    LIMIT 1;
  END IF;

  INSERT INTO public.users (id, email, full_name, role, tenant_id)
  VALUES (NEW.id, NEW.email, v_full_name, 'customer', v_tenant_id);

  RETURN NEW;
END;
$$;
