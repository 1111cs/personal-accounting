import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface AchievementAttributes {
  id: number;
  code: string;
  name: string;
  description: string;
  rarity: number;
  icon: string | null;
  created_at: Date;
}

interface AchievementCreationAttributes extends Optional<AchievementAttributes, 'id' | 'icon' | 'created_at'> {}

class Achievement extends Model<AchievementAttributes, AchievementCreationAttributes> implements AchievementAttributes {
  public id!: number;
  public code!: string;
  public name!: string;
  public description!: string;
  public rarity!: number;
  public icon!: string | null;
  public created_at!: Date;
}

Achievement.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    rarity: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
    },
    icon: {
      type: DataTypes.STRING(50),
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
    tableName: 'achievements',
    timestamps: false,
  }
);

export default Achievement;
