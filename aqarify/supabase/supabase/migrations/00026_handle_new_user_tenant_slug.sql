-- Fix customer signup: robust role parsing + optional tenant_slug from auth metadata.
-- Also remove legacy duplicate RLS policy names from 00003 (superseded by 00015).

DROP POLICY IF EXISTS "own_profile" ON users;
DROP POLICY IF EXISTS "tenant_managers_read" ON users;
DROP POLICY IF EXISTS "super_admin_all" ON users;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role public.user_role;
  v_full_name text;
  v_slug text;
  v_tenant_id uuid;
  v_meta text;
BEGIN
  v_full_name := COALESCE(
    NULLIF(trim(NEW.raw_user_meta_data->>'full_name'), ''),
    split_part(NEW.email, '@', 1)
  );

  v_slug := NULLIF(lower(trim(NEW.raw_user_meta_data->>'tenant_slug')), '');

  v_meta := NEW.raw_user_meta_data->>'role';
  IF v_meta IS NULL OR v_meta = '' THEN
    v_role := 'customer';
  ELSE
    BEGIN
      v_role := v_meta::public.user_role;
    EXCEPTION
      WHEN invalid_text_representation THEN
        v_role := 'customer';
    END;
  END IF;

  IF v_slug IS NOT NULL THEN
    SELECT t.id
    INTO v_tenant_id
    FROM public.tenants t
    WHERE t.slug = v_slug
      AND t.status IN ('active', 'read_only', 'trial')
    LIMIT 1;
  END IF;

  INSERT INTO public.users (id, email, full_name, role, tenant_id)
  VALUES (NEW.id, NEW.email, v_full_name, v_role, v_tenant_id);

  RETURN NEW;
END;
$$;
