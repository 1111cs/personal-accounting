import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface PriceRecordAttributes {
  id: number;
  user_id: number;
  item_name: string;
  unit_price: number;
  unit: string;
  purchase_date: Date;
  location: string | null;
  created_at: Date;
}

interface PriceRecordCreationAttributes extends Optional<PriceRecordAttributes, 'id' | 'unit' | 'location' | 'created_at'> {}

class PriceRecord extends Model<PriceRecordAttributes, PriceRecordCreationAttributes> implements PriceRecordAttributes {
  public id!: number;
  public user_id!: number;
  public item_name!: string;
  public unit_price!: number;
  public unit!: string;
  public purchase_date!: Date;
  public location!: string | null;
  public created_at!: Date;
}

PriceRecord.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    item_name: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    unit_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    unit: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: '斤',
    },
    purchase_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    location: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: null,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'price_records',
    timestamps: false,
  }
);

export default PriceRecord;
