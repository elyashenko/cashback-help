-- Migration: Add Alfabank with descriptions
-- Date: 2024-12-19

-- 1. Удаляем столбец cashbackRate из таблицы banks (если существует)
ALTER TABLE banks
DROP COLUMN IF EXISTS cashbackRate;

-- 2. Добавляем столбец description в таблицу cashback_categories
ALTER TABLE cashback_categories 
ADD COLUMN description TEXT;

-- Опционально: добавить комментарий к столбцу
COMMENT ON COLUMN cashback_categories.description IS 'Описание категории кэшбэка из PDF банка';

-- 3. Вставка банка Альфа-Банк
INSERT INTO banks (name, code, logo_url, is_active)
VALUES (
    'Альфа-Банк',
    'alfabank',
    'https://alfabank.ru/favicon.ico',
    true
)
ON CONFLICT (code) DO UPDATE SET 
    name = EXCLUDED.name,
    logo_url = EXCLUDED.logo_url;

-- 4. Удаление старых категорий Альфа-Банка (если есть)
DELETE FROM cashback_categories WHERE bank_id = (SELECT id FROM banks WHERE code = 'alfabank');

-- 5. Вставка категорий с описаниями

-- Авто (общая)
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'alfabank'),
    'Авто',
    ARRAY['4784', '5013', '5271', '5511', '5521', '5531', '5532', '5533', '5551', '5561', '5571', '5592', '5598', '5599', '7511', '7523', '7531', '7534', '7535', '7538', '7542', '7549', '3991'],
    NULL,
    'Кэшбэк за покупки в автомагазинах, на автомойках, химчистках автомобилей, на СТО, шиномонтажах, в автосервисах, на парковках, за буксировку, за дорожные сборы, пошлины, аренду стояночных мест, покупку автоприцепов, автодомов, запчастей, автодеталей и автоаксессуаров',
    true
);

-- Автозапчасти
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'alfabank'),
    'Автозапчасти',
    ARRAY['5013', '5271', '5511', '5531', '5532', '5533'],
    NULL,
    'Кэшбэк за покупку запчастей, автодеталей и автоаксессуаров',
    true
);

-- Автоуслуги
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'alfabank'),
    'Автоуслуги',
    ARRAY['7531', '7534', '7535', '7538', '7549', '4784', '7511', '7523', '7542'],
    NULL,
    'Кэшбэк за покупки на автомойках, химчистках автомобилей, на СТО, шиномонтажах, в автосервисах, на парковках, за буксировку, за дорожные сборы, пошлины, аренду стояночных мест',
    true
);

-- АЗС
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'alfabank'),
    'АЗС',
    ARRAY['5172', '5541', '5542', '5552', '5983', '9752', '3990'],
    NULL,
    'Кэшбэк за покупки на АЗС, заправках электромобилей, за приобретение топлива для автомобилей в том числе, если вы не клиент Альфа-Банка покупаете топливо через сервис Альфа-Заправки',
    true
);

-- Аксессуары
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'alfabank'),
    'Аксессуары',
    ARRAY['5948', '7251', '7631'],
    NULL,
    'Кэшбэк за покупки аксессуаров одежды (сумок, ремней, зонтов, чемоданов, портмоне, перчаток и т.п.), ремонт одежды и обуви',
    true
);

-- Активный отдых
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'alfabank'),
    'Активный отдых',
    ARRAY['7032', '7932', '7933', '7996', '7998', '7999', '7941', '7992', '7997'],
    NULL,
    'Кэшбэк за покупку товаров и услуг для отдыха на природе, в том числе кемпингах, оплату палаточных услуг, лыжных и горнолыжных курортов, тематических парков, аквапарков, за прокат водного транспорта и лодок, дайвинга и плавания, за покупку билетов на спортивные мероприятия, занятия спортом в спортклубах, боулинг, бассейнах, на катках, за посещение фитнеса, йоги, SPA-салонов, саун, бань, массажных и соляриев',
    true
);

-- Алкоголь
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'alfabank'),
    'Алкоголь',
    ARRAY['5921'],
    NULL,
    'Кэшбэк за покупки алкогольной продукции, в том числе в барах и ресторанах',
    true
);

-- Аптеки
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'alfabank'),
    'Аптеки',
    ARRAY['5122', '5912', '3991'],
    NULL,
    'Кэшбэк за покупки в аптеках, в том числе, если вы не клиент Альфа-Банка покупаете товары через сервис СберЗдоровье',
    true
);

-- Аренда авто
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'alfabank'),
    'Аренда авто',
    ARRAY['3351', '3352', '3353', '3354', '3355', '3356', '3357', '3358', '3359', '3360', '3361', '3362', '3363', '3364', '3365', '3366', '3367', '3368', '3369', '3370', '3371', '3372', '3373', '3374', '3375', '3376', '3377', '3378', '3379', '3380', '3381', '3382', '3383', '3384', '3385', '3386', '3387', '3388', '3389', '3390', '3391', '3392', '3393', '3394', '3395', '3396', '3397', '3398', '3400', '3401', '3402', '3403', '3404', '3405', '3406', '3407', '3408', '3409', '3410', '3412', '3413', '3414', '3415', '3416', '3417', '3418', '3419', '3420', '3421', '3422', '3423', '3425', '3426', '3427', '3428', '3429', '3430', '3431', '3432', '3433', '3434', '3435', '3436', '3437', '3438', '3439', '3441', '7512', '7513', '7519', '3990', '3991'],
    NULL,
    'Кэшбэк за аренду автомобилей',
    true
);

-- Детские товары
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'alfabank'),
    'Детские товары',
    ARRAY['5641', '5945'],
    NULL,
    'Кэшбэк за покупки детских товаров, детского питания, детской одежды и обуви, подгузников',
    true
);

-- Дом и ремонт
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'alfabank'),
    'Дом и ремонт',
    ARRAY['0780', '1520', '1711', '1731', '1740', '1750', '1761', '1771', '2842', '5021', '5039', '5046', '5051', '5072', '5074', '5085', '5198', '5200', '5211', '5231', '5251', '5261', '5712', '5713', '5714', '5718', '5719', '5950', '5996', '7217', '7641', '7692', '7699', '3990'],
    NULL,
    'Кэшбэк за покупки товаров для дома, стройматериалов, мебели, бытовых товаров, посуды, домашнего текстиля, за садово-огородные товары, растения, семена, удобрения, а также за услуги по благоустройству участка',
    true
);

-- Животные
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'alfabank'),
    'Животные',
    ARRAY['0742', '5995'],
    NULL,
    'Кэшбэк за покупки товаров для домашних животных',
    true
);

-- Здоровье
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'alfabank'),
    'Здоровье',
    ARRAY['4119', '5047', '5122', '5912', '5975', '5976', '8011', '8021', '8031', '8041', '8042', '8043', '8044', '8049', '8050', '8062', '8071', '8099'],
    NULL,
    'Кэшбэк за покупки в аптеках, оплату медицинских услуг, в том числе за медицинское страхование, за визит к стоматологу и другим специалистам, медицинские услуги для животных, медицинское оборудование и приборы, за медуслуги на дому',
    true
);

-- Кафе и рестораны
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'alfabank'),
    'Кафе и рестораны',
    ARRAY['5811', '5812', '5813'],
    NULL,
    'Кэшбэк за покупки в кафе и ресторанах, коктейль барах, частных клубах с услугами питания',
    true
);

-- Книги
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'alfabank'),
    'Книги',
    ARRAY['2741', '5111', '5192', '5942', '5943', '5994'],
    NULL,
    'Кэшбэк за покупки книг, канцтоваров, журналов, газет',
    true
);

-- Красота
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'alfabank'),
    'Красота',
    ARRAY['5977', '7230', '7297', '7298'],
    NULL,
    'Кэшбэк за покупки косметики, парфюмерии, за посещение косметологов, парикмахерских салонов, оплату услуг по маникюру, педикюру, прическе, уходу за лицом, ногтями, волосами',
    true
);

-- Культура и искусство
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'alfabank'),
    'Культура и искусство',
    ARRAY['5970', '5971', '5972', '7911', '7922', '7991', '7829', '7832', '7841', '5733', '5735', '7929'],
    NULL,
    'Кэшбэк за покупки картин, художественных товаров, товаров для коллекционирования, за оплату билетов в кино, театр, галереи, музеи, концерты, шоу, а также за платежи за подписку на онлайн-кинотеатры, онлайн-музыку, музыкальных сервисов, цифровые телеканалы',
    true
);

-- Маркетплейсы
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'alfabank'),
    'Маркетплейсы',
    ARRAY['5262', '5300', '5399', '5964', '3990', '3991'],
    NULL,
    'Кэшбэк за покупки на маркетплейсах, в интернет-магазинах, универмагах, торговых центрах, в том числе, если вы не клиент Альфа-Банка покупаете товары в сервисе Яндекс Маркет или Мегамаркет',
    true
);

-- Медицинские услуги
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'alfabank'),
    'Медицинские услуги',
    ARRAY['4119', '5047', '8011', '8031', '8041', '8042', '8043', '8049', '8050', '8062', '8071', '8099', '8021'],
    NULL,
    'Кэшбэк за оплату медицинских услуг, за визит к стоматологу и другим специалистам, медицинские услуги для животных, медицинское оборудование и приборы, медуслуги на дому, лаборатории',
    true
);

-- Образование
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'alfabank'),
    'Образование',
    ARRAY['8211', '8220', '8241', '8244', '8249', '8299', '8351', '3990'],
    NULL,
    'Кэшбэк за оплату образовательных услуг, школ, дополнительного образования, курсов, колледжей, семинаров и университетов, школьных принадлежностей',
    true
);

-- Одежда и обувь
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'alfabank'),
    'Одежда и обувь',
    ARRAY['5137', '5611', '5621', '5631', '5651', '5681', '5691', '5699', '5931', '7296', '5139', '5661'],
    NULL,
    'Кэшбэк за покупки одежды и обуви, аксессуаров одежды (сумок, ремней, зонтов, чемоданов, портмоне, перчаток и т.п.), ремонт одежды и обуви',
    true
);

-- Покупка авто
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'alfabank'),
    'Покупка авто',
    ARRAY['5521', '5551', '5561', '5571', '5592', '5598', '5599'],
    NULL,
    'Кэшбэк за покупку новых и подержанных автомобилей, мотоциклов, снегоходов и других транспортных средств, автодомов',
    true
);

-- Продукты
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'alfabank'),
    'Продукты',
    ARRAY['5310', '5311', '5331', '5411', '5422', '5441', '5451', '5462', '5499', '9751', '3990', '3991'],
    NULL,
    'Кэшбэк за покупки продуктов питания, хлебобулочных изделий, молочных продуктов, замороженных продуктов, кондитерских изделий, в том числе, если вы не клиент Альфа-Банка заказываете еду в сервисе Яндекс Еды или Сбермаркет',
    true
);

-- Развлечения
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'alfabank'),
    'Развлечения',
    ARRAY['5733', '5945', '5946', '5947', '5949', '5970', '5971', '5972', '5998', '7032', '7221', '7395', '7829', '7832', '7841', '7911', '7922', '7929', '7932', '7933', '7941', '7991', '7992', '7993', '7994', '7996', '7997', '7998', '7999', '3990', '3991'],
    NULL,
    'Кэшбэк за покупки игрушек, игр, товаров для хобби, за оплату билетов в кино, театр, галереи, музеи, концерты, а также за покупку товаров и услуг для отдыха на природе, в том числе кемпингах, оплату палаточных услуг, лыжных и горнолыжных курортов, тематических парков, аквапарков, за прокат водного транспорта и лодок, дайвинга и плавания, за покупку билетов на спортивные мероприятия, занятия спортом в спортклубах, боулинг, бассейнах, на катках, за посещение фитнеса, йоги, SPA-салонов, саун, бань, массажных и соляриев',
    true
);

-- Связь, интернет и ТВ
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'alfabank'),
    'Связь, интернет и ТВ',
    ARRAY['4813', '4814', '4815', '4816', '4821', '4899', '7372', '7375'],
    NULL,
    'Кэшбэк за услуги мобильной связи, интернета, кабельного и спутникового ТВ, оплату подписок на цифровые сервисы, компьютерное обслуживание и ремонт',
    true
);

-- Спортивные товары
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'alfabank'),
    'Спортивные товары',
    ARRAY['5655', '5940', '5941'],
    NULL,
    'Кэшбэк за покупки спортивных товаров, спортивной одежды и обуви',
    true
);

-- Супермаркеты
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'alfabank'),
    'Супермаркеты',
    ARRAY['5262', '5300', '5310', '5311', '5331', '5399', '5411', '5422', '5441', '5451', '5462', '5499', '5964', '7278', '9751', '3990', '3991'],
    NULL,
    'Кэшбэк за покупки в супермаркетах, универсамах, продуктовых магазинах, гипермаркетах, универмагах, на маркетплейсах, в том числе, если вы не клиент Альфа-Банка заказываете товары в сервисе Яндекс Маркет или Мегамаркет',
    true
);

-- Такси
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'alfabank'),
    'Такси',
    ARRAY['4121', '3990'],
    NULL,
    'Кэшбэк за поездки в такси, если вы не клиент Альфа-Банка, за такси в сервисе Яндекс Go',
    true
);

-- Техника
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'alfabank'),
    'Техника',
    ARRAY['5044', '5045', '5065', '5722', '5732', '5978', '5997', '7379', '7622', '7623', '7629', '3990', '3991'],
    NULL,
    'Кэшбэк за покупки техники, электроники, бытовой техники, компьютеров, фото-видео оборудования, за ремонт техники, в том числе, если вы не клиент Альфа-Банка покупаете товары в сервисе Яндекс Маркет или Мегамаркет',
    true
);

-- Товары для здоровья
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'alfabank'),
    'Товары для здоровья',
    ARRAY['5975', '5976', '8044'],
    NULL,
    'Кэшбэк за покупки оптики, медтехники, медоборудования, слуховых аппаратов, ортопедических принадлежностей',
    true
);

-- Транспорт
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'alfabank'),
    'Транспорт',
    ARRAY['4011', '4012', '4112', '4131', '4729', '4789', '3990'],
    NULL,
    'Кэшбэк за покупку билетов на ЖД транспорт, метро, автобусы, электрички, троллейбусы, трамваи, паромы, такси, если вы не клиент Альфа-Банка, за такси в сервисе Яндекс Go',
    true
);

-- Фастфуд
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'alfabank'),
    'Фастфуд',
    ARRAY['5814', '3990'],
    NULL,
    'Кэшбэк за покупки в заведениях быстрого питания, кафе быстрого обслуживания, доставку еды, если вы не клиент Альфа-Банка через Яндекс Еду',
    true
);

-- Фастфуд, кафе и рестораны (комбинированная)
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'alfabank'),
    'Фастфуд, кафе и рестораны',
    ARRAY['5814', '5811', '5812', '5813', '3990'],
    NULL,
    'Кэшбэк за покупки в заведениях быстрого питания, кафе быстрого обслуживания, доставку еды, кафе и ресторанах, коктейль барах, частных клубах с услугами питания',
    true
);

-- Хобби
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'alfabank'),
    'Хобби',
    ARRAY['5946', '5947', '5949', '5998', '7221', '7395', '7993', '7994'],
    NULL,
    'Кэшбэк за покупки товаров для хобби, игр, игрушек, товаров для коллекционирования, музыкальных инструментов и оборудования для ди-джеев, фототоваров',
    true
);

-- Цветы
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'alfabank'),
    'Цветы',
    ARRAY['5193', '5992'],
    NULL,
    'Кэшбэк за покупки растений, семян, цветов, в том числе в цветочных магазинах, оранжереях, цветочных оптовых рынках',
    true
);

-- Цифровые товары
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'alfabank'),
    'Цифровые товары',
    ARRAY['5734', '5735', '5815', '5816', '5817', '5818'],
    NULL,
    'Кэшбэк за покупки цифровых товаров, подписок на онлайн-кинотеатры, онлайн-музыку, музыкальных сервисов, цифровых телеканалов, компьютерных игр и программ',
    true
);

-- Ювелирные изделия
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'alfabank'),
    'Ювелирные изделия',
    ARRAY['5094', '5944'],
    NULL,
    'Кэшбэк за покупки ювелирных изделий, часов, драгоценных металлов и камней',
    true
);

-- Специальные категории сервисов Альфа-Банка

-- Альфа-Тревел
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'alfabank'),
    'Альфа-Тревел',
    ARRAY['4722'],
    NULL,
    'Кэшбэк за покупки авиабилетов через сервис Альфа-Тревел',
    true
);