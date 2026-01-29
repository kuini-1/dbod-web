import { DataTypes, Model, Optional } from "sequelize";
import { dbod_acc } from "../database/connection";

interface ServerStatusAttributes {
    id: number,
    player_count?: number;
    auth?: number;
    chat?: number;
    char?: number;
    ch0?: number;
    ch1?: number;
    ch2?: number;
    ch3?: number;
    ch4?: number;
    ch5?: number;
    ch6?: number;
    ch7?: number;
    ch8?: number;
    ch9?: number;
}
export interface ServerStatusInput extends Optional<ServerStatusAttributes, 'id'> {}
export interface ServerStatusOuput extends Required<ServerStatusAttributes> {}

class server_status extends Model<ServerStatusAttributes, ServerStatusInput> implements ServerStatusAttributes {
    public id!: number
    public player_count!: number
    public auth!: number
    public chat!: number
    public char!: number
    public ch0!: number
    public ch1!: number
    public ch2!: number
    public ch3!: number
    public ch4!: number
    public ch5!: number
    public ch6!: number
    public ch7!: number
    public ch8!: number
    public ch9!: number
}
  
server_status.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    player_count: {
        type: DataTypes.SMALLINT,
    },
    auth: {
        type: DataTypes.TINYINT,
    },
    chat: {
        type: DataTypes.TINYINT,
    },
    char: {
        type: DataTypes.TINYINT,
    },
    ch0: {
        type: DataTypes.TINYINT,
    },
    ch1: {
        type: DataTypes.TINYINT,
    },
    ch2: {
        type: DataTypes.TINYINT,
    },
    ch3: {
        type: DataTypes.TINYINT,
    },
    ch4: {
        type: DataTypes.TINYINT,
    },
    ch5: {
        type: DataTypes.TINYINT,
    },
    ch6: {
        type: DataTypes.TINYINT,
    },
    ch7: {
        type: DataTypes.TINYINT,
    },
    ch8: {
        type: DataTypes.TINYINT,
    },
    ch9: {
        type: DataTypes.TINYINT,
    }
  }, {
    freezeTableName: true,
    timestamps: false,
    sequelize: dbod_acc,
})

let serverStatusSynced = false;
export async function ensureServerStatusTable() {
    if (serverStatusSynced) return;
    await server_status.sync({ alter: true });
    serverStatusSynced = true;
}

export { server_status }
