import { DataTypes, Model, Optional } from "sequelize";
import { dbod_char } from "../database/connection";

/** Matches `CREATE TABLE characters` in dbod_char.sql; CCBD_* / Item_Worth are extra web columns after the dump. */
interface CharactersAttributes {
    CharID: number;
    CharName: string;
    AccountID: number;
    Level: number;
    Exp: number;
    Race: number | null;
    Class: number | null;
    Gender: number | null;
    Face: number | null;
    Adult: number;
    Hair: number;
    HairColor: number;
    SkinColor: number;
    Blood: number;
    CurLocX: number;
    CurLocY: number;
    CurLocZ: number;
    CurDirX: number;
    CurDirY: number;
    CurDirZ: number;
    WorldID: number;
    WorldTable: number;
    MapInfoIndex: number;
    Money: number;
    MoneyBank: number;
    TutorialFlag: number;
    TutorialHint: number;
    NameChange: number;
    Reputation: number;
    MudosaPoint: number;
    SpPoint: number;
    GameMaster: number;
    GuildID: number;
    GuildName: string | null;
    CurLP: number;
    CurEP: number;
    CurRP: number;
    CurAP: number;
    MailIsAway: number;
    SrvFarmID: number;
    DelCharTime: number | null;
    Hoipoi_NormalStart: number;
    Hoipoi_SpecialStart: number;
    Hoipoi_Type: number;
    Hoipoi_MixLevel: number;
    Hoipoi_MixExp: number;
    Title: number;
    Mascot: number;
    RpBall: number;
    Netpy: number;
    WaguPoint: number;
    IP: string;
    AirState: number;
    InvisibleCostume: number;
    PlayTime: number;
    SuperiorEffectType: number;
    CreateTime: number;
    IsOnline: number | null;
    EventGift: number | null;
    BoughtSP: number | null;
    CCBD_Token?: number;
    CCBD_Limit?: number;
    CCBD_Entry?: number;
    Item_Worth?: number;
    CCBD_Last_Refresh?: number;
}

export interface CharactersInput extends Optional<CharactersAttributes, "CharID"> {}
export interface CharactersOuput extends Required<CharactersAttributes> {}

class characters extends Model<CharactersAttributes, CharactersInput> implements CharactersAttributes {
    public CharID!: number;
    public CharName!: string;
    public AccountID!: number;
    public Level!: number;
    public Exp!: number;
    public Race!: number | null;
    public Class!: number | null;
    public Gender!: number | null;
    public Face!: number | null;
    public Adult!: number;
    public Hair!: number;
    public HairColor!: number;
    public SkinColor!: number;
    public Blood!: number;
    public CurLocX!: number;
    public CurLocY!: number;
    public CurLocZ!: number;
    public CurDirX!: number;
    public CurDirY!: number;
    public CurDirZ!: number;
    public WorldID!: number;
    public WorldTable!: number;
    public MapInfoIndex!: number;
    public Money!: number;
    public MoneyBank!: number;
    public TutorialFlag!: number;
    public TutorialHint!: number;
    public NameChange!: number;
    public Reputation!: number;
    public MudosaPoint!: number;
    public SpPoint!: number;
    public GameMaster!: number;
    public GuildID!: number;
    public GuildName!: string | null;
    public CurLP!: number;
    public CurEP!: number;
    public CurRP!: number;
    public CurAP!: number;
    public MailIsAway!: number;
    public SrvFarmID!: number;
    public DelCharTime!: number | null;
    public Hoipoi_NormalStart!: number;
    public Hoipoi_SpecialStart!: number;
    public Hoipoi_Type!: number;
    public Hoipoi_MixLevel!: number;
    public Hoipoi_MixExp!: number;
    public Title!: number;
    public Mascot!: number;
    public RpBall!: number;
    public Netpy!: number;
    public WaguPoint!: number;
    public IP!: string;
    public AirState!: number;
    public InvisibleCostume!: number;
    public PlayTime!: number;
    public SuperiorEffectType!: number;
    public CreateTime!: number;
    public IsOnline!: number | null;
    public EventGift!: number | null;
    public BoughtSP!: number | null;
    public CCBD_Token!: number;
    public CCBD_Limit!: number;
    public CCBD_Entry!: number;
    public Item_Worth!: number;
    public CCBD_Last_Refresh!: number;
}

characters.init(
    {
        CharID: {
            type: DataTypes.INTEGER.UNSIGNED,
            primaryKey: true,
            autoIncrement: false,
        },
        CharName: {
            type: DataTypes.STRING(255),
            primaryKey: true,
            allowNull: false,
        },
        AccountID: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
        },
        Level: {
            type: DataTypes.TINYINT.UNSIGNED,
            allowNull: false,
            defaultValue: 1,
        },
        Exp: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            defaultValue: 0,
        },
        Race: { type: DataTypes.TINYINT.UNSIGNED, allowNull: true, defaultValue: null },
        Class: { type: DataTypes.TINYINT.UNSIGNED, allowNull: true, defaultValue: null },
        Gender: { type: DataTypes.TINYINT.UNSIGNED, allowNull: true, defaultValue: null },
        Face: { type: DataTypes.TINYINT.UNSIGNED, allowNull: true, defaultValue: null },
        Adult: {
            type: DataTypes.TINYINT.UNSIGNED,
            allowNull: false,
            defaultValue: 0,
        },
        Hair: { type: DataTypes.TINYINT.UNSIGNED, allowNull: false },
        HairColor: {
            type: DataTypes.TINYINT.UNSIGNED,
            allowNull: false,
            defaultValue: 0,
        },
        SkinColor: {
            type: DataTypes.TINYINT.UNSIGNED,
            allowNull: false,
            defaultValue: 0,
        },
        Blood: {
            type: DataTypes.TINYINT.UNSIGNED,
            allowNull: false,
            defaultValue: 0,
        },
        CurLocX: {
            type: DataTypes.FLOAT,
            allowNull: false,
            defaultValue: 78.900002,
        },
        CurLocY: {
            type: DataTypes.FLOAT,
            allowNull: false,
            defaultValue: 46.950001,
        },
        CurLocZ: {
            type: DataTypes.FLOAT,
            allowNull: false,
            defaultValue: 168.350006,
        },
        CurDirX: {
            type: DataTypes.FLOAT,
            allowNull: false,
            defaultValue: 0.95,
        },
        CurDirY: {
            type: DataTypes.FLOAT,
            allowNull: false,
            defaultValue: 0,
        },
        CurDirZ: {
            type: DataTypes.FLOAT,
            allowNull: false,
            defaultValue: 0.3,
        },
        WorldID: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            defaultValue: 1,
        },
        WorldTable: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            defaultValue: 1,
        },
        MapInfoIndex: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            defaultValue: 0,
        },
        Money: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            defaultValue: 0,
        },
        MoneyBank: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            defaultValue: 0,
        },
        TutorialFlag: {
            type: DataTypes.TINYINT,
            allowNull: false,
            defaultValue: 0,
        },
        TutorialHint: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            defaultValue: 0,
        },
        NameChange: {
            type: DataTypes.TINYINT,
            allowNull: false,
            defaultValue: 0,
        },
        Reputation: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            defaultValue: 0,
        },
        MudosaPoint: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            defaultValue: 0,
        },
        SpPoint: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            defaultValue: 0,
        },
        GameMaster: {
            type: DataTypes.TINYINT,
            allowNull: false,
            defaultValue: 0,
        },
        GuildID: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            defaultValue: 0,
        },
        GuildName: {
            type: DataTypes.STRING(16),
            allowNull: true,
            defaultValue: null,
        },
        CurLP: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 15000,
        },
        CurEP: {
            type: DataTypes.SMALLINT.UNSIGNED,
            allowNull: false,
            defaultValue: 15000,
        },
        CurRP: {
            type: DataTypes.SMALLINT.UNSIGNED,
            allowNull: false,
            defaultValue: 0,
        },
        CurAP: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 450000,
        },
        MailIsAway: {
            type: DataTypes.TINYINT,
            allowNull: false,
            defaultValue: 0,
        },
        SrvFarmID: {
            type: DataTypes.INTEGER.UNSIGNED,
            primaryKey: true,
            allowNull: false,
            defaultValue: 0,
        },
        DelCharTime: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: true,
            defaultValue: null,
        },
        Hoipoi_NormalStart: {
            type: DataTypes.TINYINT,
            allowNull: false,
            defaultValue: 0,
        },
        Hoipoi_SpecialStart: {
            type: DataTypes.TINYINT,
            allowNull: false,
            defaultValue: 0,
        },
        Hoipoi_Type: {
            type: DataTypes.TINYINT.UNSIGNED,
            allowNull: false,
            defaultValue: 255,
        },
        Hoipoi_MixLevel: {
            type: DataTypes.TINYINT.UNSIGNED,
            allowNull: false,
            defaultValue: 1,
        },
        Hoipoi_MixExp: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            defaultValue: 0,
        },
        Title: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            defaultValue: 4294967295,
        },
        Mascot: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            defaultValue: 4294967295,
        },
        RpBall: {
            type: DataTypes.TINYINT.UNSIGNED,
            allowNull: false,
            defaultValue: 0,
        },
        Netpy: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            defaultValue: 0,
        },
        WaguPoint: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            defaultValue: 0,
        },
        IP: {
            type: DataTypes.STRING(16),
            allowNull: false,
            defaultValue: "0.0.0.0",
        },
        AirState: {
            type: DataTypes.TINYINT.UNSIGNED,
            allowNull: false,
            defaultValue: 0,
        },
        InvisibleCostume: {
            type: DataTypes.TINYINT,
            allowNull: false,
            defaultValue: 0,
        },
        PlayTime: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: false,
            defaultValue: 0,
        },
        SuperiorEffectType: {
            type: DataTypes.TINYINT.UNSIGNED,
            allowNull: false,
            defaultValue: 0,
        },
        CreateTime: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: false,
        },
        IsOnline: {
            type: DataTypes.TINYINT,
            allowNull: true,
            defaultValue: 0,
        },
        EventGift: {
            type: DataTypes.TINYINT,
            allowNull: true,
            defaultValue: 0,
        },
        BoughtSP: {
            type: DataTypes.SMALLINT,
            allowNull: true,
            defaultValue: 0,
        },
        // Web / patch columns (not in base dbod_char.sql dump)
        CCBD_Token: { type: DataTypes.TINYINT, allowNull: true, defaultValue: 0 },
        CCBD_Limit: { type: DataTypes.TINYINT, allowNull: true, defaultValue: 5 },
        CCBD_Entry: { type: DataTypes.TINYINT, allowNull: true, defaultValue: 5 },
        Item_Worth: { type: DataTypes.TINYINT, allowNull: true, defaultValue: 0 },
        CCBD_Last_Refresh: { type: DataTypes.BIGINT, allowNull: true, defaultValue: 0 },
    },
    {
        freezeTableName: true,
        timestamps: false,
        sequelize: dbod_char,
    }
);

export { characters };
