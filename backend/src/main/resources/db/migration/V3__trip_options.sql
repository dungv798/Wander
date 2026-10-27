-- Q11 (DR-002, gói C): tùy chọn chuyến đi. Tất cả tùy chọn.
-- budget_k: ngân sách dự kiến, nghìn đồng (NULL = chưa đặt; 0 = đã đặt bằng 0, D18). Cùng giới hạn như chi phí (D17).
-- styles: mã kiểu chuyến cách nhau bằng dấu phẩy, theo thứ tự khai báo ('' = không có); tối đa 5 mã, kiểm ở domain.
-- pace: nhịp chuyến (NULL = chưa đặt).
ALTER TABLE trips ADD COLUMN budget_k bigint
    CHECK (budget_k IS NULL OR (budget_k >= 0 AND budget_k <= 1000000000));
ALTER TABLE trips ADD COLUMN styles varchar(100) NOT NULL DEFAULT '';
ALTER TABLE trips ADD COLUMN pace varchar(16)
    CHECK (pace IS NULL OR pace IN ('relaxed', 'moderate', 'packed'));
