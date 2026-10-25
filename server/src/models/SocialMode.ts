import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface SocialModeAttributes {
  id: number;
  user_id: number;
  mode_date: string;
  multiplier: number;
  reserve_deducted: number;
  created_at: Date;
}

interface SocialModeCreationAttributes extends Optional<SocialModeAttributes, 'id' | 'reserve_deducted' | 'created_at'> {}

class SocialMode extends Model<SocialModeAttributes, SocialModeCreationAttributes> implements SocialModeAttributes {
  public id!: number;
  public user_id!: number;
  public mode_date!: string;
  public multiplier!: number;
  public reserve_deducted!: number;
  public created_at!: Date;
}

SocialMode.init(
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
    mode_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    multiplier: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: false,
      defaultValue: 1.0,
    },
    reserve_deducted: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'social_modes',
    timestamps: false,
  }
);

export default SocialMode;
