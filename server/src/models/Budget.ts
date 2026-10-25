import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface BudgetAttributes {
  id: number;
  user_id: number;
  budget_month: string;
  total_budget: number;
  reserve_fund: number;
  spent_base: number;
  created_at: Date;
  updated_at: Date;
}

interface BudgetCreationAttributes extends Optional<BudgetAttributes, 'id' | 'spent_base' | 'created_at' | 'updated_at'> {}

class Budget extends Model<BudgetAttributes, BudgetCreationAttributes> implements BudgetAttributes {
  public id!: number;
  public user_id!: number;
  public budget_month!: string;
  public total_budget!: number;
  public reserve_fund!: number;
  public spent_base!: number;
  public created_at!: Date;
  public updated_at!: Date;
}

Budget.init(
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
    budget_month: {
      type: DataTypes.CHAR(7),
      allowNull: false,
    },
    total_budget: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    reserve_fund: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    spent_base: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
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
    tableName: 'budgets',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default Budget;
