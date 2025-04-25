const config = {
    items: {
        weapon: {
            common: [
                { 
                    name: "COMPENSATOR",
                    cost: 1000, 
                    description: "A simple weapon attachment that improves firing accuracy.",
                    iconPath: "res/items/common_compensator.png",
                    stats: {
                        weaponPower: 5
                    },
                    sharedItem: true // Indicates this item is shared across all heroes
                },
                { 
                    name: "RAPID LOADER",
                    cost: 1000,
                    description: "Reduces the time needed to reload your primary weapon.",
                    iconPath: "",
                    stats: {
                        reloadSpeed: 5
                    },
                    sharedItem: true
                },
                { 
                    name: "TARGETING SIGHT",
                    cost: 1000,
                    description: "Improves accuracy when firing.",
                    iconPath: "",
                    stats: {
                        criticalDamage: 5
                    },
                    sharedItem: true
                },
                { 
                    name: "ACCELERATOR",
                    cost: 1500,
                    description: "Increases weapon firing rate.",
                    iconPath: "",
                    stats: {
                        attackSpeed: 8
                    },
                    sharedItem: true
                },
                { 
                    name: "EXTENDED MAG",
                    cost: 1500,
                    description: "Increases ammunition capacity.",
                    iconPath: "",
                    stats: {
                        maxAmmo: 10
                    },
                    sharedItem: true
                }
            ],
            rare: [
                { 
                    name: "ENHANCED COMPENSATOR",
                    cost: 3750,
                    description: "A more powerful weapon attachment with improved accuracy.",
                    iconPath: "",
                    stats: {
                        weaponPower: 12
                    },
                    sharedItem: true
                },
                { 
                    name: "TACTICAL LOADER",
                    cost: 4000,
                    description: "Significantly reduces reload time.",
                    iconPath: "",
                    stats: {
                        reloadSpeed: 15
                    },
                    sharedItem: true
                },
                { 
                    name: "PRECISION SIGHT",
                    cost: 4000,
                    description: "Greatly improves accuracy and targeting.",
                    iconPath: "",
                    stats: {
                        criticalDamage: 15
                    },
                    sharedItem: true
                },
                { 
                    name: "ENHANCED ACCELERATOR",
                    cost: 4000,
                    description: "Significantly increases weapon firing rate.",
                    iconPath: "",
                    stats: {
                        attackSpeed: 15
                    },
                    sharedItem: true
                },
                { 
                    name: "TACTICAL MAG",
                    cost: 4500,
                    description: "Significantly increases ammunition capacity.",
                    iconPath: "",
                    stats: {
                        maxAmmo: 20
                    },
                    sharedItem: true
                },
                { 
                    name: "VAMPIRIC ROUNDS",
                    cost: 5000,
                    description: "Your weapon attacks restore a portion of damage as health.",
                    iconPath: "",
                    stats: {
                        weaponLifesteal: 8
                    },
                    sharedItem: true
                },
                { 
                    name: "HEAVY CALIBER",
                    cost: 5500,
                    description: "Increases weapon damage significantly.",
                    iconPath: "",
                    stats: {
                        weaponPower: 20
                    },
                    sharedItem: true
                }
            ],
            epic: [
                { 
                    name: "QUANTUM COMPENSATOR",
                    cost: 9000,
                    description: "An advanced weapon attachment with superior accuracy.",
                    iconPath: "",
                    stats: {
                        weaponPower: 25
                    },
                    sharedItem: true
                },
                { 
                    name: "HYPER LOADER",
                    cost: 9500,
                    description: "Dramatically reduces reload time.",
                    iconPath: "",
                    stats: {
                        reloadSpeed: 30
                    },
                    sharedItem: true
                },
                { 
                    name: "QUANTUM SIGHT",
                    cost: 9500,
                    description: "Dramatically improves accuracy and critical hits.",
                    iconPath: "",
                    stats: {
                        criticalDamage: 30
                    },
                    sharedItem: true
                },
                { 
                    name: "HYPER ACCELERATOR",
                    cost: 10000,
                    description: "Dramatically increases weapon firing rate.",
                    iconPath: "",
                    stats: {
                        attackSpeed: 30
                    },
                    sharedItem: true
                },
                { 
                    name: "QUANTUM MAG",
                    cost: 10000,
                    description: "Dramatically increases ammunition capacity.",
                    iconPath: "",
                    stats: {
                        maxAmmo: 40
                    },
                    sharedItem: true
                },
                { 
                    name: "BLOODTHIRSTY ROUNDS",
                    cost: 11000,
                    description: "Your weapon attacks restore a significant portion of damage as health.",
                    iconPath: "",
                    stats: {
                        weaponLifesteal: 15
                    },
                    sharedItem: true
                },
                { 
                    name: "DEVASTATING CALIBER",
                    cost: 11000,
                    description: "Dramatically increases weapon damage.",
                    iconPath: "",
                    stats: {
                        weaponPower: 35
                    },
                    sharedItem: true
                },
                { 
                    name: "ARMOR PIERCING ROUNDS",
                    cost: 11000,
                    description: "Your weapon attacks ignore a portion of enemy armor.",
                    iconPath: "",
                    stats: {
                        weaponPower: 25,
                        criticalDamage: 20
                    },
                    sharedItem: true
                },
                { 
                    name: "COMBAT MEDIC ROUNDS",
                    cost: 11000,
                    description: "Your weapon attacks heal nearby allies for a small amount.",
                    iconPath: "",
                    stats: {
                        weaponPower: 15,
                        weaponLifesteal: 10
                    },
                    sharedItem: true
                },
                { 
                    name: "EXPERIMENTAL AMMUNITION",
                    cost: 13000,
                    description: "Advanced experimental ammo with powerful damage properties.",
                    iconPath: "",
                    stats: {
                        weaponPower: 40,
                        criticalDamage: 15
                    },
                    sharedItem: true
                },
                { 
                    name: "QUANTUM ACCELERATOR",
                    cost: 13500,
                    description: "Cutting-edge technology that maximizes weapon performance.",
                    iconPath: "",
                    stats: {
                        weaponPower: 30,
                        attackSpeed: 20
                    },
                    sharedItem: true
                },
                { 
                    name: "UNSTABLE CORE",
                    cost: 10000, 
                    isRed: true,
                    description: "Increases damage dramatically but damages the user over time.",
                    iconPath: "",
                    stats: {
                        weaponPower: 50
                    }
                }
            ]
        },
        ability: {
            common: [
                { 
                    name: "FOCUSING CRYSTAL",
                    cost: 1200,
                    description: "Enhances ability power output.",
                    iconPath: "",
                    stats: {
                        abilityPower: 5
                    },
                    sharedItem: true
                },
                { 
                    name: "EFFICIENCY MODULE",
                    cost: 1300,
                    description: "Reduces ability cooldowns.",
                    iconPath: "",
                    stats: {
                        cooldownReduction: 5
                    },
                    sharedItem: true
                },
                { 
                    name: "ABILITY AMPLIFIER",
                    cost: 1400,
                    description: "Amplifies ability effectiveness.",
                    iconPath: "",
                    stats: {
                        abilityPower: 8
                    },
                    sharedItem: true
                }
            ],
            rare: [
                { 
                    name: "ENHANCED CRYSTAL",
                    cost: 4200,
                    description: "Significantly enhances ability power output.",
                    iconPath: "",
                    stats: {
                        abilityPower: 15
                    },
                    sharedItem: true
                },
                { 
                    name: "TACTICAL MODULE",
                    cost: 4300,
                    description: "Significantly reduces ability cooldowns.",
                    iconPath: "",
                    stats: {
                        cooldownReduction: 15
                    },
                    sharedItem: true
                },
                { 
                    name: "ENHANCED AMPLIFIER",
                    cost: 4400,
                    description: "Significantly amplifies ability effectiveness.",
                    iconPath: "",
                    stats: {
                        abilityPower: 18,
                        cooldownReduction: 8
                    },
                    sharedItem: true
                }
            ],
            epic: [
                { 
                    name: "QUANTUM CRYSTAL",
                    cost: 9200,
                    description: "Dramatically enhances ability power output.",
                    iconPath: "",
                    stats: {
                        abilityPower: 30
                    },
                    sharedItem: true
                },
                { 
                    name: "QUANTUM MODULE",
                    cost: 9300,
                    description: "Dramatically reduces ability cooldowns.",
                    iconPath: "",
                    stats: {
                        cooldownReduction: 30
                    },
                    sharedItem: true
                },
                { 
                    name: "QUANTUM AMPLIFIER",
                    cost: 9400,
                    description: "Dramatically amplifies ability effectiveness and recovery.",
                    iconPath: "",
                    stats: {
                        abilityPower: 25,
                        cooldownReduction: 15
                    },
                    sharedItem: true
                }
            ]
        },
        survival: {
            common: [
                { 
                    name: "REINFORCED PLATING",
                    cost: 1600,
                    description: "Reinforces armor to provide additional protection.",
                    iconPath: "",
                    stats: {
                        health: 50
                    },
                    sharedItem: true
                },
                { 
                    name: "MOBILITY ENHANCER",
                    cost: 1700,
                    description: "Increases movement speed.",
                    iconPath: "",
                    stats: {
                        moveSpeed: 5
                    },
                    sharedItem: true
                },
                { 
                    name: "SHIELD GENERATOR",
                    cost: 1800,
                    description: "Generates a protective shield.",
                    iconPath: "",
                    stats: {
                        shield: 25
                    },
                    sharedItem: true
                }
            ],
            rare: [
                { 
                    name: "ENHANCED PLATING",
                    cost: 4600,
                    description: "Significantly reinforces armor for superior protection.",
                    iconPath: "",
                    stats: {
                        health: 100,
                        armor: 20
                    },
                    sharedItem: true
                },
                { 
                    name: "TACTICAL ENHANCER",
                    cost: 4700,
                    description: "Significantly increases movement speed.",
                    iconPath: "",
                    stats: {
                        moveSpeed: 15
                    },
                    sharedItem: true
                },
                { 
                    name: "ENHANCED GENERATOR",
                    cost: 4800,
                    description: "Generates a strong protective shield.",
                    iconPath: "",
                    stats: {
                        shield: 75
                    },
                    sharedItem: true
                }
            ],
            epic: [
                { 
                    name: "QUANTUM PLATING",
                    cost: 9600,
                    description: "Cutting-edge armor technology for maximum protection.",
                    iconPath: "",
                    stats: {
                        health: 150,
                        armor: 50
                    },
                    sharedItem: true
                },
                { 
                    name: "QUANTUM ENHANCER",
                    cost: 9700,
                    description: "Dramatically increases movement speed.",
                    iconPath: "",
                    stats: {
                        moveSpeed: 30
                    },
                    sharedItem: true
                },
                { 
                    name: "QUANTUM GENERATOR",
                    cost: 9800,
                    description: "Generates a powerful protective shield with regenerative properties.",
                    iconPath: "",
                    stats: {
                        shield: 100,
                        armor: 25
                    },
                    sharedItem: true
                }
            ]
        }
    },
    powers: [
        {
            title: "FOCUSED FUSION",
            color: "orange",
            description: "[Fusion Cannon]'s spread is reduced by 66% and damage falloff range is 20m farther."
        },
        {
            title: "LEGENDARY LOADOUT",
            color: "orange",
            description: "[Micro Missiles] are replaced with 6 Heavy Rockets, which deal 350% more explosive damage and have 100% increased radius."
        },
        {
            title: "OVERSTOCKED",
            color: "blue",
            description: "Gain 1 extra charge of [Micro Missiles]."
        },
        {
            title: "COUNTERMEASURES",
            color: "purple",
            description: "When you mitigate 150 damage with [Defense Matrix], automatically fire 2 [Micro Missiles]."
        },
        {
            title: "FACETANKING",
            color: "green",
            description: "[Defense Matrix] heals you for 30% of the damage it blocks."
        },
        {
            title: "ULTRAWIDE MATRIX",
            color: "blue",
            description: "Increase the size of [Defense Matrix] by 50% and its duration by 20%."
        },
        {
            title: "IGNITION BURST",
            color: "orange",
            description: "[Boosters] leave a trail of lava that deals 30 damage every 1s."
        },
        {
            title: "MEKA PUNCH",
            color: "orange",
            description: "While using [Boosters], [Quick Melee] deals 75% more damage. MEKA Punch eliminations reset the cooldown of [Boosters]."
        },
        {
            title: "STAT BOOST",
            color: "blue",
            description: "During the first 2s of [Boosters], [Defense Matrix] recovers 100% faster."
        },
        {
            title: "TOKKI SLAM",
            color: "orange",
            description: "During [Boosters], use crouch to slam the ground, dealing damage equal to 20% of your max Armor and knocking up enemies hit."
        },
        {
            title: "EXPRESS DETONATION",
            color: "green",
            description: "[Self-Destruct] explodes 15% faster."
        },
        {
            title: "PARTY PROTECTOR",
            color: "purple",
            description: "When you use [Self-Destruct], allies within [Self-Destruct] radius gain 250 Overhealth for 8s."
        }
    ]
};