/**
 * `eITEM_TYPE` indices match Server/NtlShared2/NtlItem.h (first entry = 0).
 * Main vs sub weapon follows `Dbo_GetItemCategoryByItemType` (GLOVE/STAFF/GUN/DUAL = main; SWORD etc. = sub).
 */
export const ITEM_TYPE_GLOVE = 0;
export const ITEM_TYPE_SWORD = 9;
export const ITEM_TYPE_STICK = 8;
export const ITEM_TYPE_JACKET = 18;
export const ITEM_TYPE_PANTS = 19;
export const ITEM_TYPE_BOOTS = 20;
export const ITEM_TYPE_NECKLACE = 21;
export const ITEM_TYPE_EARRING = 22;
export const ITEM_TYPE_RING = 23;

/** Mirrors `DBO_ITEM_CATEGORY_*` in NtlItem.h */
export const DBO_ITEM_CATEGORY_MAIN_WEAPON = 0;
export const DBO_ITEM_CATEGORY_SUB_WEAPON = 1;
export const DBO_ITEM_CATEGORY_JACKET = 2;
export const DBO_ITEM_CATEGORY_PANTS = 3;
export const DBO_ITEM_CATEGORY_BOOTS = 4;
export const DBO_ITEM_CATEGORY_EARRING = 5;
export const DBO_ITEM_CATEGORY_NECKLACE = 6;
export const DBO_ITEM_CATEGORY_RING = 7;

export type EquipmentCategoryId =
    | 'main_weapon'
    | 'sub_weapon'
    | 'jacket'
    | 'pants'
    | 'boots'
    | 'necklace'
    | 'earring'
    | 'ring';

/** Representative `byItem_Type` per UI slot → used with server category mapping. */
export const EQUIPMENT_CATEGORY_TO_ITEM_TYPE: Record<EquipmentCategoryId, number> = {
    main_weapon: ITEM_TYPE_GLOVE,
    sub_weapon: ITEM_TYPE_SWORD,
    jacket: ITEM_TYPE_JACKET,
    pants: ITEM_TYPE_PANTS,
    boots: ITEM_TYPE_BOOTS,
    necklace: ITEM_TYPE_NECKLACE,
    earring: ITEM_TYPE_EARRING,
    ring: ITEM_TYPE_RING,
};

export const EQUIPMENT_CATEGORY_LABELS: Record<EquipmentCategoryId, string> = {
    main_weapon: 'Main weapon',
    sub_weapon: 'Sub weapon',
    jacket: 'Jacket',
    pants: 'Pants',
    boots: 'Boots',
    necklace: 'Necklace',
    earring: 'Earring',
    ring: 'Ring',
};

/**
 * `Dbo_GetItemCategoryByItemType` — NtlItem.cpp
 */
export function dboGetItemCategoryByItemType(byItemType: number): number {
    switch (byItemType) {
        case 0: // ITEM_TYPE_GLOVE
        case 1: // STAFF
        case 2: // GUN
        case 3: // DUAL_GUN
            return DBO_ITEM_CATEGORY_MAIN_WEAPON;

        case 4: // CLAW
        case 5: // AXE
        case 6: // SCROLL
        case 7: // GEM
        case 8: // STICK
        case 9: // SWORD
        case 10: // FAN
        case 11: // WAND
        case 12: // BAZOOKA
        case 13: // BACK_PACK
        case 14: // INSTRUMENT
        case 15: // CLUB
        case 16: // DRUM
        case 17: // MASK
            return DBO_ITEM_CATEGORY_SUB_WEAPON;

        case 18:
            return DBO_ITEM_CATEGORY_JACKET;
        case 19:
            return DBO_ITEM_CATEGORY_PANTS;
        case 20:
            return DBO_ITEM_CATEGORY_BOOTS;
        case 21:
            return DBO_ITEM_CATEGORY_NECKLACE;
        case 22:
            return DBO_ITEM_CATEGORY_EARRING;
        case 23:
            return DBO_ITEM_CATEGORY_RING;

        default:
            return 14;
    }
}

export function getItemCategoryFlagForEquipmentCategory(cat: EquipmentCategoryId): number {
    const itemType = EQUIPMENT_CATEGORY_TO_ITEM_TYPE[cat];
    const catIdx = dboGetItemCategoryByItemType(itemType);
    return 1 << catIdx;
}
