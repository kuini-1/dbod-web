import { DataTypes, Model, Optional } from "sequelize";
import { dbod_char } from "../database/connection";

interface CharactersAttributes {
    CharID: number,
    CharName?: string;
    AccountID?: number;
    Level?: number;
    Exp?: number;
    Race?: number;
    Class?: number;
    Gender?: number;
    Face?: number;
    Adult?: number;
    Hair?: number;
    HairColor?: number;
    SkinColor?: number;
    Blood?: number;
    CurLocX?: number;
    CurLocY?: number;
    CurLocZ?: number;
    CurDirX?: number;
    CurDirY?: number;
    CurDirZ?: number;
    WorldID?: number;
    WorldTable?: number;
    MapInfoIndex?: number;
    Money?: number;
    MoneyBank?: number;
    TutorialFlag?: number;
    TutorialHint?: number;
    NameChange?: number;
    Reputation?: number;
    MudosaPoint?: number;
    SpPoint?: number;
    GameMaster?: number;
    GuildID?: number;
    GuildName?: string;
    CurLP?: number;
    CurEP?: number;
    CurRP?: number;
    CurAP?: number;
    MailIsAway?: number;
    SrvFarmID?: number;
    DelCharTime?: number;
    Hoipoi_NormalStart?: number;
    Hoipoi_SpecialStart?: number;
    Hoipoi_Type?: number;
    Hoipoi_MixLevel?: number;
    Hoipoi_MixExp?: number;
    Title?: number;
    Mascot?: number;
    RpBall?: number;
    Netpy?: number;
    WaguPoint?: number;
    IP?: string;
    AirState?: number;
    InvisibleCostume?: number;
    PlayTime?: number;
    SuperiorEffectType?: number;
    CreateTime?: number;
    is_online?: number;
}
export interface CharactersInput extends Optional<CharactersAttributes, 'CharID'> {}
export interface CharactersOuput extends Required<CharactersAttributes> {}

class characters extends Model<CharactersAttributes, CharactersInput> implements CharactersAttributes {
    public CharID!: number
    public CharName!: string
    public AccountID!: number
    public Level!: number
    public Exp!: number
    public Race!: number
    public Class!: number
    public Gender!: number
    public Face!: number
    public Adult!: number
    public Hair!: number
    public HairColor!: number
    public SkinColor!: number
    public Blood!: number
    public CurLocX!: number
    public CurLocY!: number
    public CurLocZ!: number
    public CurDirX!: number
    public CurDirY!: number
    public CurDirZ!: number
    public WorldID!: number
    public WorldTable!: number
    public MapInfoIndex!: number
    public Money!: number
    public MoneyBank!: number
    public TutorialFlag!: number
    public TutorialHint!: number
    public NameChange!: number
    public Reputation!: number
    public MudosaPoint!: number
    public SpPoint!: number
    public GameMaster!: number
    public GuildID!: number
    public GuildName!: string
    public CurLP!: number
    public CurEP!: number
    public CurRP!: number
    public CurAP!: number
    public MailIsAway!: number
    public SrvFarmID!: number
    public DelCharTime!: number
    public Hoipoi_NormalStart!: number
    public Hoipoi_SpecialStart!: number
    public Hoipoi_Type!: number
    public Hoipoi_MixLevel!: number
    public Hoipoi_MixExp!: number
    public Title!: number
    public Mascot!: number
    public RpBall!: number
    public Netpy!: number
    public WaguPoint!: number
    public IP!: string
    public AirState!: number
    public InvisibleCostume!: number
    public PlayTime!: number
    public SuperiorEffectType!: number
    public CreateTime!: number
    public is_online!: number
}
  
characters.init({
    CharID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    CharName: { type: DataTypes.STRING },
    AccountID: { type: DataTypes.INTEGER },
    Level: { type: DataTypes.TINYINT },
    Exp: { type: DataTypes.INTEGER },
    Race: { type: DataTypes.TINYINT },
    Class: { type: DataTypes.TINYINT },
    Gender: { type: DataTypes.TINYINT },
    Face: { type: DataTypes.TINYINT },
    Adult: { type: DataTypes.TINYINT },
    Hair: { type: DataTypes.TINYINT },
    HairColor: { type: DataTypes.TINYINT },
    SkinColor: { type: DataTypes.TINYINT },
    Blood: { type: DataTypes.TINYINT },
    CurLocX: { type: DataTypes.FLOAT },
    CurLocY: { type: DataTypes.FLOAT },
    CurLocZ: { type: DataTypes.FLOAT },
    CurDirX: { type: DataTypes.FLOAT },
    CurDirY: { type: DataTypes.FLOAT },
    CurDirZ: { type: DataTypes.FLOAT },
    WorldID: { type: DataTypes.INTEGER },
    WorldTable: { type: DataTypes.INTEGER },
    MapInfoIndex: { type: DataTypes.INTEGER },
    Money: { type: DataTypes.BIGINT },
    MoneyBank: { type: DataTypes.BIGINT },
    TutorialFlag: { type: DataTypes.TINYINT },
    TutorialHint: { type: DataTypes.INTEGER },
    NameChange: { type: DataTypes.TINYINT },
    Reputation: { type: DataTypes.INTEGER },
    MudosaPoint: { type: DataTypes.INTEGER },
    SpPoint: { type: DataTypes.INTEGER },
    GameMaster: { type: DataTypes.TINYINT },
    GuildID: { type: DataTypes.INTEGER },
    GuildName: { type: DataTypes.STRING },
    CurLP: { type: DataTypes.INTEGER },
    CurEP: { type: DataTypes.SMALLINT },
    CurRP: { type: DataTypes.SMALLINT },
    CurAP: { type: DataTypes.INTEGER },
    MailIsAway: { type: DataTypes.TINYINT },
    SrvFarmID: { type: DataTypes.INTEGER },
    DelCharTime: { type: DataTypes.BIGINT },
    Hoipoi_NormalStart: { type: DataTypes.TINYINT },
    Hoipoi_SpecialStart: { type: DataTypes.TINYINT },
    Hoipoi_Type: { type: DataTypes.TINYINT },
    Hoipoi_MixLevel: { type: DataTypes.TINYINT },
    Hoipoi_MixExp: { type: DataTypes.INTEGER },
    Title: { type: DataTypes.INTEGER },
    Mascot: { type: DataTypes.INTEGER },
    RpBall: { type: DataTypes.TINYINT },
    Netpy: { type: DataTypes.INTEGER },
    WaguPoint: { type: DataTypes.INTEGER },
    IP: { type: DataTypes.STRING },
    AirState: { type: DataTypes.TINYINT },
    InvisibleCostume: { type: DataTypes.TINYINT },
    PlayTime: { type: DataTypes.BIGINT },
    SuperiorEffectType: { type: DataTypes.TINYINT },
    CreateTime: { type: DataTypes.BIGINT },
    is_online: { type: DataTypes.INTEGER }
  }, {
    freezeTableName: true,
    timestamps: false,
    sequelize: dbod_char,
})

export { characters }
