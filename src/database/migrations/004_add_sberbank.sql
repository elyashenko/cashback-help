-- Migration: Add Sberbank
-- Date: 2024-12-19

-- 1. Вставка банка Сбербанк
INSERT INTO banks (name, code, logo_url, is_active)
VALUES (
    'Сбербанк',
    'sberbank',
    'https://www.sberbank.ru/common/img/sberbank-logo.svg',
    true
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    logo_url = EXCLUDED.logo_url;

-- 2. Удаление старых категорий Сбербанка
DELETE FROM cashback_categories WHERE bank_id = (SELECT id FROM banks WHERE code = 'sberbank');

-- 3. Вставка новых категорий

-- На все покупки
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'sberbank'),
    'На все покупки',
    ARRAY[]::TEXT[],
    NULL,
    'Любые покупки, кроме тех, которые прямо исключены из программы',
    true
);

-- Супермаркеты
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'sberbank'),
    'Супермаркеты',
    ARRAY['3990','3991','5309','5311','5331','5399','5411','5412','5422','5441','5451','5499','5921','9751'],
    NULL,
    'Оплата товаров в универмагах, супермаркетах и продуктовых магазинах',
    true
);

-- АЗС
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'sberbank'),
    'АЗС',
    ARRAY['3990','3991','5172','5541','5542','5552','5983','9752'],
    NULL,
    'Оплата бензина и другого топлива на АЗС, покупки в автомастерских и кафе при заправках',
    true
);

-- Кафе и рестораны
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'sberbank'),
    'Кафе и рестораны',
    ARRAY['3990','3991','5462','5811','5812','5813','5814'],
    NULL,
    'Оплата в кафе, ресторанах и барах',
    true
);

-- Одежда и обувь
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'sberbank'),
    'Одежда и обувь',
    ARRAY['5137','5139','5611','5621','5631','5651','5661','5681','5691','5699','5931','5948','7296'],
    NULL,
    'Покупки в магазинах одежды, обуви, аксессуаров и химчистках',
    true
);

-- Товары для дома
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'sberbank'),
    'Товары для дома',
    ARRAY['0780','1520','1711','1740','1750','1761','1771','1799','2842','5021','5039','5051','5072','5074','5198','5200','5211','5231','5251','5261','5712','5713','5714','5718','5719','5950','5996','5998'],
    NULL,
    'Покупка мебели, стройматериалов, садовых принадлежностей и товаров для дома',
    true
);

-- Товары для детей
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'sberbank'),
    'Товары для детей',
    ARRAY['5641','5945'],
    NULL,
    'Оплата в магазинах детской одежды и игрушек',
    true
);

-- Питомцы
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'sberbank'),
    'Питомцы',
    ARRAY['0742','5995'],
    NULL,
    'Покупки в зоомагазинах и ветеринарных клиниках',
    true
);

-- Такси и каршеринг
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'sberbank'),
    'Такси и каршеринг',
    ARRAY['3990','3991','4121','7512'],
    NULL,
    'Оплата услуг такси и аренды автомобилей',
    true
);

-- Кино и театр
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'sberbank'),
    'Кино и театр',
    ARRAY['3991','7832','7833','7841','7922'],
    NULL,
    'Покупка билетов в кинотеатры и театры',
    true
);

-- Парфюмерия и косметика
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'sberbank'),
    'Парфюмерия и косметика',
    ARRAY['5977'],
    NULL,
    'Покупка косметики и парфюмерии',
    true
);

-- Образование
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'sberbank'),
    'Образование',
    ARRAY['3990','3991','8211','8220','8241','8244','8249','8299','8351'],
    NULL,
    'Оплата образовательных услуг в детских садах, школах, вузах, автошколах и репетиторских центрах',
    true
);

-- Хобби и развлечения
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'sberbank'),
    'Хобби и развлечения',
    ARRAY['2741','4457','5111','5192','5733','5735','5832','5937','5942','5943','5946','5947','5949','5970','5971','5972','5992','5994','7221','7333','7395','7911','7929','7932','7933','7991','7993','7994','7996','7998','7999'],
    NULL,
    'Оплата товаров и услуг в книжных, спортивных и музыкальных магазинах, посещение культурных и развлекательных заведений',
    true
);

-- Салоны красоты
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'sberbank'),
    'Салоны красоты',
    ARRAY['7230','7297','7298'],
    NULL,
    'Оплата услуг парикмахерских, салонов красоты и спа-салонов',
    true
);

-- Транспорт
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'sberbank'),
    'Транспорт',
    ARRAY['4111','4131'],
    NULL,
    'Оплата проезда на общественном транспорте и междугородних автобусах',
    true
);

-- Электроника и бытовая техника
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'sberbank'),
    'Электроника и бытовая техника',
    ARRAY['3991','5065','5722','5732','5997'],
    NULL,
    'Оплата в магазинах бытовой техники и электроники',
    true
);

-- Медицинские услуги
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'sberbank'),
    'Медицинские услуги',
    ARRAY['3990','4119','5975','5976','8011','8021','8031','8041','8042','8043','8044','8049','8050','8062','8071','8099'],
    NULL,
    'Оплата медицинских услуг и покупка медицинского оборудования',
    true
);

-- Спорт и фитнес
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'sberbank'),
    'Спорт и фитнес',
    ARRAY['5655','5940','5941','7941','7992','7997'],
    NULL,
    'Покупки в спортивных магазинах и оплата фитнес-центров',
    true
);

-- Аптеки
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'sberbank'),
    'Аптеки',
    ARRAY['3991','5122','5912'],
    NULL,
    'Покупки в аптеках',
    true
);

-- Впечатления
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'sberbank'),
    'Впечатления',
    ARRAY['3991','7832','7922','7933','7991','7996','7998','7999'],
    NULL,
    'Покупка билетов на концерты, в парки аттракционов и другие развлечения',
    true
);

-- Фастфуд
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'sberbank'),
    'Фастфуд',
    ARRAY['5814','3990','3991'],
    NULL,
    'Оплата в предприятиях быстрого питания',
    true
);

-- Рестораны
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'sberbank'),
    'Рестораны',
    ARRAY['5462','5811','5812','5813','3990','3991'],
    NULL,
    'Оплата в ресторанах',
    true
);

-- ЖКХ
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'sberbank'),
    'ЖКХ',
    ARRAY['4900'],
    NULL,
    'Оплата услуг ЖКХ',
    true
);

-- СпасибоТревел
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'sberbank'),
    'СпасибоТревел',
    ARRAY[]::TEXT[],
    NULL,
    'Все покупки, совершенные на сайте программы в разделе «Тревел»',
    true
);

-- На все за оплату улыбкой
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'sberbank'),
    'На всё за оплату улыбкой',
    ARRAY[]::TEXT[],
    NULL,
    'Покупки, совершенные по SberPay с использованием биометрического метода аутентификации',
    true
);

-- На всё по SberPay NFC
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'sberbank'),
    'На всё по SberPay NFC',
    ARRAY[]::TEXT[],
    NULL,
    'Покупки, совершенные по SberPay с использованием NFC – карты банка',
    true
);
