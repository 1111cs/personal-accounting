import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface BillAttributes {
  id: number;
  user_id: number;
  amount: number;
  category: 'food' | 'other';
  bill_date: string;
  note: string | null;
  tags: string[] | null;
  is_overeat: boolean;
  source: 'daily' | 'reserve' | null;
  created_at: Date;
  updated_at: Date;
}

interface BillCreationAttributes extends Optional<BillAttributes, 'id' | 'note' | 'tags' | 'is_overeat' | 'source' | 'created_at' | 'updated_at'> {}

class Bill extends Model<BillAttributes, BillCreationAttributes> implements BillAttributes {
  public id!: number;
  public user_id!: number;
  public amount!: number;
  public category!: 'food' | 'other';
  public bill_date!: string;
  public note!: string | null;
  public tags!: string[] | null;
  public is_overeat!: boolean;
  public source!: 'daily' | 'reserve' | null;
  public created_at!: Date;
  public updated_at!: Date;
}

Bill.init(
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
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    category: {
      type: DataTypes.ENUM('food', 'other'),
      allowNull: false,
    },
    bill_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    note: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: null,
    },
    tags: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: null,
    },
    is_overeat: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    source: {
      type: DataTypes.ENUM('daily', 'reserve'),
      allowNull: true,
      defaultValue: 'daily',
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'bills',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default Bill;
