insert into public.brain_courses
  (slug, title, author, category, thumbnail_url, course_url, original_price, sale_price, currency, is_free, is_visible, sort_order)
values
  ('yoga-nidra', 'YOGA NIDRA — THE ULTIMATE WHOLE BRAIN SYNCHRONIZATION', 'Dr Sweta Adatia', 'meditation', '/meditation-thumbs/yoga-nidra.webp', 'https://drive.google.com/file/d/1G7M7EiWU7tHzFkb0Gy6KIPNwUt1p3pn8/view', null, null, 'INR', true, true, 13)
on conflict (slug) do update set
  course_url = excluded.course_url,
  original_price = null,
  sale_price = null,
  is_free = true,
  is_visible = true;
