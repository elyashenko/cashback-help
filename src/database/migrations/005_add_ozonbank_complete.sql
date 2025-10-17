-- Migration: Add OZON Банк with complete categories
-- Date: 2024-12-19
-- This migration adds OZON Банк with 32 cashback categories

-- 1. Вставка банка OZON Банк
INSERT INTO banks (name, code, logo_url, is_active)
VALUES (
    'OZON Банк',
    'ozonbank',
    'https://cdn.ozon.ru/s3/multimedia-g/c1000/6004481388.jpg',
    true
)
ON CONFLICT (code) DO UPDATE SET 
    name = EXCLUDED.name,
    logo_url = EXCLUDED.logo_url;

-- 2. Удаление старых категорий OZON Банка (если есть)
DELETE FROM cashback_categories WHERE bank_id = (SELECT id FROM banks WHERE code = 'ozonbank');

-- 3. Вставка категорий с MCC-кодами

-- Авиабилеты
INSERT INTO cashback_categories (bank_id, name, mcc_codes, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'ozonbank'),
    'Авиабилеты',
    ARRAY['3000','3001','3002','3003','3004','3005','3006','3007','3008','3009','3010','3011','3012','3013','3014','3015','3016','3017','3018','3019','3020','3021','3022','3023','3024','3025','3026','3027','3028','3029','3030','3031','3032','3033','3034','3035','3036','3037','3038','3039','3040','3041','3042','3043','3044','3045','3046','3047','3048','3049','3050','3051','3052','3053','3054','3055','3056','3057','3058','3059','3060','3061','3062','3063','3064','3065','3066','3067','3068','3069','3070','3071','3072','3073','3074','3075','3076','3077','3078','3079','3080','3081','3082','3083','3084','3085','3086','3087','3088','3089','3090','3091','3092','3093','3094','3095','3096','3097','3098','3099','3100','3101','3102','3103','3104','3105','3106','3107','3108','3109','3110','3111','3112','3113','3114','3115','3116','3117','3118','3119','3120','3121','3122','3123','3124','3125','3126','3127','3128','3129','3130','3131','3132','3133','3134','3135','3136','3137','3138','3139','3140','3141','3142','3143','3144','3145','3146','3147','3148','3149','3150','3151','3152','3153','3154','3155','3156','3157','3158','3159','3160','3161','3162','3163','3164','3165','3166','3167','3168','3169','3170','3171','3172','3173','3174','3175','3176','3177','3178','3179','3180','3181','3182','3183','3184','3185','3186','3187','3188','3189','3190','3191','3192','3193','3194','3195','3196','3197','3198','3199','3200','3201','3202','3203','3204','3205','3206','3207','3208','3209','3210','3211','3212','3213','3214','3215','3216','3217','3218','3219','3220','3221','3222','3223','3224','3225','3226','3227','3228','3229','3230','3231','3232','3233','3234','3235','3236','3237','3238','3239','3240','3241','3242','3243','3244','3245','3246','3247','3248','3249','3250','3251','3252','3253','3254','3255','3256','3257','3258','3259','3260','3261','3262','3263','3264','3265','3266','3267','3268','3269','3270','3271','3272','3273','3274','3275','3276','3277','3278','3279','3280','3281','3282','3283','3284','3285','3286','3287','3288','3289','3290','3291','3292','3293','3294','3295','3296','3297','3298','3299','3300','3301','3302','3303','3308','4304','4415','4418','4511','4582'],
    'Покупка авиабилетов',
    true
);

-- Автоуслуги
INSERT INTO cashback_categories (bank_id, name, mcc_codes, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'ozonbank'),
    'Автоуслуги',
    ARRAY['5013','5511','5521','5531','5532','5533','5571','5599','7531','7534','7535','7538','7542','7549','8676'],
    'Оплата в автосервисах, автомойках, шиномонтажах и автозапчастях',
    true
);

-- Аптеки
INSERT INTO cashback_categories (bank_id, name, mcc_codes, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'ozonbank'),
    'Аптеки',
    ARRAY['5122','5912'],
    'Покупка медикаментов и товаров для здоровья',
    true
);

-- Выставки и музеи
INSERT INTO cashback_categories (bank_id, name, mcc_codes, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'ozonbank'),
    'Выставки и музеи',
    ARRAY['7991'],
    'Посещение музеев, галерей и выставок',
    true
);

-- Дом и ремонт
INSERT INTO cashback_categories (bank_id, name, mcc_codes, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'ozonbank'),
    'Дом и ремонт',
    ARRAY['0780','1520','1711','1731','1740','1750','1761','1771','5021','5039','5046','5051','5065','5072','5074','5085','5198','5200','5211','5231','5251','5261','5712','5713','5714','5718','5719','5950','7379','7622','7623','7629','7641','7692','7699'],
    'Покупка стройматериалов, мебели и товаров для дома',
    true
);

-- ЖД билеты
INSERT INTO cashback_categories (bank_id, name, mcc_codes, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'ozonbank'),
    'ЖД билеты',
    ARRAY['4011','4112'],
    'Покупка железнодорожных билетов',
    true
);

-- Вет клиники и зоомагазины
INSERT INTO cashback_categories (bank_id, name, mcc_codes, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'ozonbank'),
    'Вет клиники и зоомагазины',
    ARRAY['0742','5995'],
    'Покупка товаров для животных и ветеринарные услуги',
    true
);

-- Искусство
INSERT INTO cashback_categories (bank_id, name, mcc_codes, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'ozonbank'),
    'Искусство',
    ARRAY['5932','5937','5949','5970','5971','5972','5973'],
    'Покупка картин, антиквариата и предметов искусства',
    true
);

-- Каршеринг
INSERT INTO cashback_categories (bank_id, name, mcc_codes, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'ozonbank'),
    'Каршеринг',
    ARRAY['7512'],
    'Аренда автомобилей через каршеринг',
    true
);

-- Книги
INSERT INTO cashback_categories (bank_id, name, mcc_codes, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'ozonbank'),
    'Книги',
    ARRAY['2741','5111','5192','5942','5994'],
    'Покупка книг, газет и канцтоваров',
    true
);

-- Косметика
INSERT INTO cashback_categories (bank_id, name, mcc_codes, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'ozonbank'),
    'Косметика',
    ARRAY['5311','5977'],
    'Покупка косметики и парфюмерии',
    true
);

-- Медицинские клиники
INSERT INTO cashback_categories (bank_id, name, mcc_codes, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'ozonbank'),
    'Медицинские клиники',
    ARRAY['4119','5047','5975','5976','8011','8021','8031','8041','8042','8043','8044','8049','8050','8062','8071','8099'],
    'Оплата медицинских услуг и покупка медицинского оборудования',
    true
);

-- Музыка
INSERT INTO cashback_categories (bank_id, name, mcc_codes, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'ozonbank'),
    'Музыка',
    ARRAY['5733','5735'],
    'Покупка музыкальных инструментов и принадлежностей',
    true
);

-- Образование
INSERT INTO cashback_categories (bank_id, name, mcc_codes, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'ozonbank'),
    'Образование',
    ARRAY['8211','8220','8241','8244','8249','8299','8351'],
    'Оплата образовательных услуг в школах, вузах и на курсах',
    true
);

-- Одежда и обувь
INSERT INTO cashback_categories (bank_id, name, mcc_codes, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'ozonbank'),
    'Одежда и обувь',
    ARRAY['5137','5139','5611','5621','5631','5651','5661','5681','5691','5699','5931'],
    'Покупка одежды, обуви и аксессуаров',
    true
);

-- Отели
INSERT INTO cashback_categories (bank_id, name, mcc_codes, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'ozonbank'),
    'Отели',
    ARRAY['3501','3502','3503','3504','3505','3506','3507','3508','3509','3510','3511','3512','3513','3514','3515','3516','3517','3518','3519','3520','3521','3522','3523','3524','3525','3526','3527','3528','3529','3530','3531','3532','3533','3534','3535','3536','3537','3538','3539','3540','3541','3542','3543','3544','3545','3546','3547','3548','3549','3550','3551','3552','3553','3554','3555','3556','3557','3558','3559','3560','3561','3562','3563','3564','3565','3566','3567','3568','3569','3570','3571','3572','3573','3574','3575','3576','3577','3578','3579','3580','3581','3582','3583','3584','3585','3586','3587','3588','3589','3590','3591','3592','3593','3594','3595','3596','3597','3598','3599','3600','3601','3602','3603','3604','3605','3606','3607','3608','3609','3610','3611','3612','3613','3614','3615','3616','3617','3618','3619','3620','3621','3622','3623','3624','3625','3626','3627','3628','3629','3630','3631','3632','3633','3634','3635','3636','3637','3638','3639','3640','3641','3642','3643','3644','3645','3646','3647','3648','3649','3650','3651','3652','3653','3654','3655','3656','3657','3658','3659','3660','3661','3662','3663','3664','3665','3666','3667','3668','3669','3670','3671','3672','3673','3674','3675','3676','3677','3678','3679','3680','3681','3682','3683','3684','3685','3686','3687','3688','3689','3690','3691','3692','3693','3694','3695','3696','3697','3698','3699','3700','3701','3702','3703','3704','3705','3706','3707','3708','3709','3710','3711','3712','3713','3714','3715','3716','3717','3718','3719','3720','3721','3722','3723','3724','3725','3726','3727','3728','3729','3730','3731','3732','3733','3734','3735','3736','3737','3738','3739','3740','3741','3742','3743','3744','3745','3746','3747','3748','3749','3750','3751','3752','3753','3754','3755','3756','3757','3758','3759','3760','3761','3762','3763','3764','3765','3766','3767','3768','3769','3770','3771','3772','3773','3774','3775','3776','3777','3778','3779','3780','3781','3782','3783','3784','3785','3786','3787','3788','3789','3790','3791','3792','3793','3794','3795','3796','3797','3798','3799','3800','3801','3802','3803','3804','3805','3806','3807','3808','3809','3810','3811','3812','3813','3814','3815','3816','3817','3818','3819','3820','3821','3822','3823','3824','3825','3826','3827','3830','3831','3832','3833','3834','3835','3836','3837','3838','4722','7011','7032','7033'],
    'Оплата проживания в отелях и гостиницах',
    true
);

-- Развлечения
INSERT INTO cashback_categories (bank_id, name, mcc_codes, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'ozonbank'),
    'Развлечения',
    ARRAY['5816','7829','7832','7841','7911','7922','7929','7932','7933','7992','7993','7994','7996','7998','7999'],
    'Посещение развлекательных мероприятий, кино, концертов',
    true
);

-- Рестораны
INSERT INTO cashback_categories (bank_id, name, mcc_codes, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'ozonbank'),
    'Рестораны',
    ARRAY['5811','5812','5813'],
    'Оплата в ресторанах, кафе и барах',
    true
);

-- Салоны красоты и СПА
INSERT INTO cashback_categories (bank_id, name, mcc_codes, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'ozonbank'),
    'Салоны красоты и СПА',
    ARRAY['7230','7297','7298'],
    'Оплата услуг салонов красоты, парикмахерских и СПА',
    true
);

-- Спорттовары
INSERT INTO cashback_categories (bank_id, name, mcc_codes, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'ozonbank'),
    'Спорттовары',
    ARRAY['5655','5940','5941'],
    'Покупка спортивных товаров и инвентаря',
    true
);

-- Супермаркеты
INSERT INTO cashback_categories (bank_id, name, mcc_codes, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'ozonbank'),
    'Супермаркеты',
    ARRAY['5411','5412','5422','5441','5451','5462','5499','5921'],
    'Покупка продуктов питания в супермаркетах',
    true
);

-- Такси
INSERT INTO cashback_categories (bank_id, name, mcc_codes, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'ozonbank'),
    'Такси',
    ARRAY['4121'],
    'Оплата услуг такси',
    true
);

-- Товары для детей
INSERT INTO cashback_categories (bank_id, name, mcc_codes, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'ozonbank'),
    'Товары для детей',
    ARRAY['5641','5945'],
    'Покупка детских товаров и игрушек',
    true
);

-- Топливо и АЗС
INSERT INTO cashback_categories (bank_id, name, mcc_codes, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'ozonbank'),
    'Топливо и АЗС',
    ARRAY['5172','5541','5542','5552','5983'],
    'Покупка топлива на АЗС и зарядка электромобилей',
    true
);

-- Транспорт
INSERT INTO cashback_categories (bank_id, name, mcc_codes, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'ozonbank'),
    'Транспорт',
    ARRAY['4111','4131','4784','4789','7519','7523'],
    'Оплата проезда в общественном транспорте и платных дорог',
    true
);

-- Фастфуд
INSERT INTO cashback_categories (bank_id, name, mcc_codes, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'ozonbank'),
    'Фастфуд',
    ARRAY['5814'],
    'Оплата в заведениях быстрого питания',
    true
);

-- Фитнес
INSERT INTO cashback_categories (bank_id, name, mcc_codes, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'ozonbank'),
    'Фитнес',
    ARRAY['7941','7997'],
    'Оплата абонементов в фитнес-клубы и спортзалы',
    true
);

-- Фото и видео
INSERT INTO cashback_categories (bank_id, name, mcc_codes, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'ozonbank'),
    'Фото и видео',
    ARRAY['5044','5045','5946','7221','7332','7333','7338','7339','7395'],
    'Покупка фото- и видеотехники, услуги фотостудий',
    true
);

-- Химчистки
INSERT INTO cashback_categories (bank_id, name, mcc_codes, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'ozonbank'),
    'Химчистки',
    ARRAY['7216'],
    'Оплата услуг химчисток и прачечных',
    true
);

-- Цветы
INSERT INTO cashback_categories (bank_id, name, mcc_codes, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'ozonbank'),
    'Цветы',
    ARRAY['5193','5992'],
    'Покупка цветов и растений',
    true
);

-- Электроника и бытовая техника
INSERT INTO cashback_categories (bank_id, name, mcc_codes, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'ozonbank'),
    'Электроника и бытовая техника',
    ARRAY['5722','5732'],
    'Покупка электроники, бытовой техники и аксессуаров',
    true
);

-- Ювелирные изделия
INSERT INTO cashback_categories (bank_id, name, mcc_codes, description, is_active)
VALUES (
    (SELECT id FROM banks WHERE code = 'ozonbank'),
    'Ювелирные изделия',
    ARRAY['5094','5944'],
    'Покупка ювелирных украшений и часов',
    true
);
