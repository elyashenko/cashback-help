-- Migration: Add Tinkoff Bank
-- Date: 2024-12-19

-- 1. Вставка банка Тинькофф
INSERT INTO banks (name, code, logo_url, is_active)
VALUES (
    'Тинькофф',
    'tinkoff',
    'https://acdn.tinkoff.ru/static/documents/41eb49c8-6f88-4128-ab33-5525d9bd38c1.png',
    true
)
ON CONFLICT (code) DO UPDATE SET 
    name = EXCLUDED.name,
    logo_url = EXCLUDED.logo_url;

-- 2. Удаление старых категорий Тинькофф (если есть)
DELETE FROM cashback_categories WHERE bank_id = (SELECT id FROM banks WHERE code = 'tinkoff');

-- 3. Вставка категорий Тинькофф

-- ГРУППА: АВТО

-- Автоуслуги
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'tinkoff'),
    'Автоуслуги',
    ARRAY['5013', '5521', '5531', '5532', '5533', '5571', '7012', '7531', '7534', '7535', '7538', '7542', '7549'],
    NULL,
    'Покупка автозапчастей. Оплата в автосервисах, на СТО и автомойках',
    true
);

-- Топливо
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'tinkoff'),
    'Топливо',
    ARRAY['5172', '5541', '5542', '5983'],
    NULL,
    'Оплата бензина и другого топлива на заправочных станциях и в профильных магазинах, а также покупок в магазинах и кафе при АЗС',
    true
);

-- Платные дороги
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'tinkoff'),
    'Платные дороги',
    ARRAY['4784'],
    NULL,
    'Плата за проезд по платным дорогам, трассам и мостам',
    true
);

-- Зарядка электромобилей
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'tinkoff'),
    'Зарядка электромобилей',
    ARRAY['5552'],
    NULL,
    'Оплата на зарядных станциях',
    true
);

-- ГРУППА: ДОМ И БЫТ

-- Дом и Ремонт
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'tinkoff'),
    'Дом и Ремонт',
    ARRAY['1520', '1711', '1731', '1740', '1750', '1761', '1771', '1799', '2791', '2842', '5021', '5039', '5046', '5051', '5065', '5072', '5074', '5085', '5198', '5200', '5211', '5231', '5251', '5261', '5415', '5712', '5713', '5714', '5718', '5719', '5722', '7622', '7623', '7629', '7641', '7692', '7699'],
    NULL,
    'Оплата в магазинах для отделки и обустройства дома, а также в мебельных салонах',
    true
);

-- Животные
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'tinkoff'),
    'Животные',
    ARRAY['5995', '0742'],
    NULL,
    'Оплата в зоомагазинах и ветклиниках',
    true
);

-- ГРУППА: ДОСУГ

-- Искусство
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'tinkoff'),
    'Искусство',
    ARRAY['5932', '5937', '5970', '5971', '5972', '5973'],
    NULL,
    'Покупки в галереях, антикварных магазинах, у арт-дилеров',
    true
);

-- Кино
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'tinkoff'),
    'Кино',
    ARRAY['7829', '7832'],
    NULL,
    'Оплата товаров и услуг кинотеатров',
    true
);

-- Музыка
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'tinkoff'),
    'Музыка',
    ARRAY['5733', '5735'],
    NULL,
    'Оплата в магазинах музыкальных инструментов',
    true
);

-- Онлайн-кинотеатры
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'tinkoff'),
    'Онлайн-кинотеатры',
    ARRAY['7841'],
    NULL,
    'Оплата подписок на Netflix, IVI, Okko.tv, MEGOGO, Кинопоиск, Amazon Prime Video, more.tv',
    true
);

-- Развлечения
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'tinkoff'),
    'Развлечения',
    ARRAY['7911', '7922', '7929', '7932', '7933', '7941', '7991', '7992', '7993', '7994', '7996', '7997', '7998', '7999', '8664'],
    NULL,
    'Оплата в боулингах, парках аттракционов, цирках и других местах для досуга',
    true
);

-- Цифровые товары
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'tinkoff'),
    'Цифровые товары',
    ARRAY['0019', '5815', '5816', '5817', '5818'],
    NULL,
    'Покупка аудиовизуальных медиа, игр и других приложений, и подписок',
    true
);

-- ГРУППА: КРАСОТА И ЗДОРОВЬЕ

-- Аптеки
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'tinkoff'),
    'Аптеки',
    ARRAY['5122', '5292', '5295', '5912'],
    NULL,
    'Оплата в аптеках и профильных магазинах медикаментов',
    true
);

-- Красота
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'tinkoff'),
    'Красота',
    ARRAY['5977', '7230', '7297', '7298'],
    NULL,
    'Оплата в магазинах косметики и парфюмерии, в косметических и SPA-салонах',
    true
);

-- Косметика
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'tinkoff'),
    'Косметика',
    ARRAY['5977'],
    NULL,
    'Оплата в профильных магазинах косметики, парфюмерии и средств по уходу за собой',
    true
);

-- ГРУППА: ЕДА ВНЕ ДОМА

-- Рестораны
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'tinkoff'),
    'Рестораны',
    ARRAY['5811', '5812', '5813'],
    NULL,
    'Оплата в ресторанах, кафе, барах — не включая рестораны быстрого обслуживания',
    true
);

-- Фастфуд
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'tinkoff'),
    'Фастфуд',
    ARRAY['5814'],
    NULL,
    'Оплата в ресторанах быстрого питания',
    true
);

-- ГРУППА: ОБРАЗОВАНИЕ

-- Канцтовары
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'tinkoff'),
    'Канцтовары',
    ARRAY['5111', '5943'],
    NULL,
    'Оплата в оптовых и розничных магазинах канцелярии и товаров для офиса',
    true
);

-- Книги
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'tinkoff'),
    'Книги',
    ARRAY['2741', '5111', '5192', '5942', '5994'],
    NULL,
    'Оплата в книжных магазинах и газетных киосках',
    true
);

-- Образование
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'tinkoff'),
    'Образование',
    ARRAY['8211', '8220', '8241', '8244', '8249', '8299', '8493', '8494', '8351'],
    NULL,
    'Оплата в государственных и частных школах, вузах и училищах, а также плата за профильное обучение: бизнесу, искусствам, спорту, вождению',
    true
);

-- ГРУППА: ПРОДУКТЫ

-- Супермаркеты
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'tinkoff'),
    'Супермаркеты',
    ARRAY['5297', '5298', '5411', '5412', '5422', '5441', '5451', '5462', '5499', '5715', '5921'],
    NULL,
    'Оплата в супермаркетах и профильных продуктовых магазинах / Оплата на сайтах или в приложениях супермаркетов и профильных продуктовых магазинах',
    true
);

-- ГРУППА: ПРОЧЕЕ

-- Фото и Видео
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'tinkoff'),
    'Фото и Видео',
    ARRAY['5044', '5045', '5946', '7221', '7332', '7333', '7338', '7339', '7395'],
    NULL,
    'Оплата в профильных магазинах оборудования для фото- и видеосъемки',
    true
);

-- ГРУППА: ПУТЕШЕСТВИЯ

-- Duty Free
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'tinkoff'),
    'Duty Free',
    ARRAY['5309'],
    NULL,
    'Оплата в магазинах беспошлинной торговли',
    true
);

-- Авиабилеты (диапазон 3000-3299 разбит на отдельные коды)
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'tinkoff'),
    'Авиабилеты',
    ARRAY['3000', '3001', '3002', '3003', '3004', '3005', '3006', '3007', '3008', '3009', '3010', '3011', '3012', '3013', '3014', '3015', '3016', '3017', '3018', '3019', '3020', '3021', '3022', '3023', '3024', '3025', '3026', '3027', '3028', '3029', '3030', '3031', '3032', '3033', '3034', '3035', '3036', '3037', '3038', '3039', '3040', '3041', '3042', '3043', '3044', '3045', '3046', '3047', '3048', '3049', '3050', '3051', '3052', '3053', '3054', '3055', '3056', '3057', '3058', '3059', '3060', '3061', '3062', '3063', '3064', '3065', '3066', '3067', '3068', '3069', '3070', '3071', '3072', '3073', '3074', '3075', '3076', '3077', '3078', '3079', '3080', '3081', '3082', '3083', '3084', '3085', '3086', '3087', '3088', '3089', '3090', '3091', '3092', '3093', '3094', '3095', '3096', '3097', '3098', '3099', '3100', '3101', '3102', '3103', '3104', '3105', '3106', '3107', '3108', '3109', '3110', '3111', '3112', '3113', '3114', '3115', '3116', '3117', '3118', '3119', '3120', '3121', '3122', '3123', '3124', '3125', '3126', '3127', '3128', '3129', '3130', '3131', '3132', '3133', '3134', '3135', '3136', '3137', '3138', '3139', '3140', '3141', '3142', '3143', '3144', '3145', '3146', '3147', '3148', '3149', '3150', '3151', '3152', '3153', '3154', '3155', '3156', '3157', '3158', '3159', '3160', '3161', '3162', '3163', '3164', '3165', '3166', '3167', '3168', '3169', '3170', '3171', '3172', '3173', '3174', '3175', '3176', '3177', '3178', '3179', '3180', '3181', '3182', '3183', '3184', '3185', '3186', '3187', '3188', '3189', '3190', '3191', '3192', '3193', '3194', '3195', '3196', '3197', '3198', '3199', '3200', '3201', '3202', '3203', '3204', '3205', '3206', '3207', '3208', '3209', '3210', '3211', '3212', '3213', '3214', '3215', '3216', '3217', '3218', '3219', '3220', '3221', '3222', '3223', '3224', '3225', '3226', '3227', '3228', '3229', '3230', '3231', '3232', '3233', '3234', '3235', '3236', '3237', '3238', '3239', '3240', '3241', '3242', '3243', '3244', '3245', '3246', '3247', '3248', '3249', '3250', '3251', '3252', '3253', '3254', '3255', '3256', '3257', '3258', '3259', '3260', '3261', '3262', '3263', '3264', '3265', '3266', '3267', '3268', '3269', '3270', '3271', '3272', '3273', '3274', '3275', '3276', '3277', '3278', '3279', '3280', '3281', '3282', '3283', '3284', '3285', '3286', '3287', '3288', '3289', '3290', '3291', '3292', '3293', '3294', '3295', '3296', '3297', '3298', '3299', '4304', '4415', '4418', '4511', '4582'],
    NULL,
    'Оплата авиабилетов в онлайн-сервисах, офисах авиакомпаний, кассах аэропортов',
    true
);

-- Ж/д билеты
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'tinkoff'),
    'Ж/д билеты',
    ARRAY['4011', '4112'],
    NULL,
    'Оплата билетов на поезда и электрички в кассах, онлайн-сервисах и терминалах',
    true
);

-- ГРУППА: ТРАНСПОРТ

-- Аренда авто
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'tinkoff'),
    'Аренда авто',
    ARRAY['3351', '3352', '3353', '3354', '3355', '3356', '3357', '3358', '3359', '3360', '3361', '3362', '3363', '3364', '3365', '3366', '3367', '3368', '3369', '3370', '3371', '3372', '3373', '3374', '3375', '3376', '3377', '3378', '3379', '3380', '3381', '3382', '3383', '3384', '3385', '3386', '3387', '3388', '3389', '3390', '3391', '3392', '3393', '3394', '3395', '3396', '3397', '3398', '3400', '3401', '3402', '3403', '3404', '3405', '3406', '3407', '3408', '3409', '3410', '3412', '3413', '3414', '3415', '3416', '3417', '3418', '3419', '3420', '3421', '3422', '3423', '3425', '3426', '3427', '3428', '3429', '3430', '3431', '3432', '3433', '3434', '3435', '3436', '3437', '3438', '3439', '3441', '7512', '7513', '7519'],
    NULL,
    'Оплата автомобилей напрокат в дилерских центрах',
    true
);

-- Каршеринг
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'tinkoff'),
    'Каршеринг',
    ARRAY['7512', '4121'],
    NULL,
    'Краткосрочная аренда авто с оплатой по минутам или часам — не включая услуги такси и аренду в дилерских центрах',
    true
);

-- Местный транспорт
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'tinkoff'),
    'Местный транспорт',
    ARRAY['4111'],
    NULL,
    'Оплата проезда в метро, наземном общественном транспорте и в разделе «Транспорт» Т‑Банка',
    true
);

-- Такси
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'tinkoff'),
    'Такси',
    ARRAY['4121'],
    NULL,
    'Оплата водителям и онлайн-службам такси. В категорию не входит каршеринг',
    true
);

-- Транспорт (общая)
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'tinkoff'),
    'Транспорт',
    ARRAY['4111', '4131', '4784', '4789', '5271', '5592', '7511', '7523'],
    NULL,
    'Плата в такси, городском и пригородном общественном транспорте. Взносы за пользование парковками, гаражами и платными дорогами. Оплата в разделе «Транспорт» приложения и сайта Банка. Покупка спецтехники и лизинг авто — не включая авто напрокат',
    true
);

-- ГРУППА: ШОППИНГ

-- Детские товары
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'tinkoff'),
    'Детские товары',
    ARRAY['5641', '5945'],
    NULL,
    'Оплата игрушек и одежды в детских магазинах, отделах товаров для детей и магазинах игрушек',
    true
);

-- Маркетплейсы (без MCC кодов, определяется по мерчанту)
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'tinkoff'),
    'Маркетплейсы',
    ARRAY[]::TEXT[],
    NULL,
    'Оплата товаров и услуг на онлайн-площадках',
    true
);

-- Одежда и обувь
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'tinkoff'),
    'Одежда и обувь',
    ARRAY['5094', '5137', '5139', '5611', '5621', '5631', '5641', '5651', '5661', '5681', '5691', '5697', '5698', '5699', '5931', '5944', '5949', '5950', '7296', '7631'],
    NULL,
    'Оплата в магазинах одежды, обуви и аксессуаров, драгоценностей и часов / Оплата на сайтах или в приложениях магазинов одежды, обуви, аксессуаров и часов',
    true
);

-- Спорттовары
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'tinkoff'),
    'Спорттовары',
    ARRAY['5655', '5940', '5941'],
    NULL,
    'Оплата в профильных спортивных магазинах',
    true
);

-- Сувениры
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'tinkoff'),
    'Сувениры',
    ARRAY['5947'],
    NULL,
    'Оплата открыток, воздушных шаров, праздничных украшений, подарочной упаковки и других товаров в магазинах подарков и сувенирных лавках',
    true
);

-- Цветы
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'tinkoff'),
    'Цветы',
    ARRAY['5193', '5992'],
    NULL,
    'Оплата в цветочных магазинах, салонах флористики и профильных магазинах для садоводов',
    true
);

-- Электроника и техника
INSERT INTO cashback_categories (bank_id, name, mcc_codes, cashback_rate, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'tinkoff'),
    'Электроника и техника',
    ARRAY['5722', '5732'],
    NULL,
    'Оплата покупок, а также услуг по установке в профильных магазинах бытовой техники и электроники',
    true
);
