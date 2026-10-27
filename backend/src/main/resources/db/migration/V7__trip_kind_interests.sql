-- ADR-014 / DR-018 F2: "ai đi" (kind) và sở thích (interests) là thuộc tính của chuyến. Chỉ là nhãn như styles và pace.
-- kind: một mã hoặc NULL (chưa đặt). interests: mã cách nhau bằng dấu phẩy theo thứ tự khai báo ('' = không có), tối đa 6, kiểm ở domain.
ALTER TABLE trips ADD COLUMN kind varchar(16)
    CHECK (kind IS NULL OR kind IN ('solo', 'family', 'friends', 'couple', 'work'));
ALTER TABLE trips ADD COLUMN interests varchar(100) NOT NULL DEFAULT '';
