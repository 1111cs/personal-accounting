import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface StreakRecordAttributes {
  id: number;
  user_id: number;
  current_streak: number;
  best_streak: number;
  last_updated: Date;
}

interface StreakRecordCreationAttributes extends Optional<StreakRecordAttributes, 'id'> {}

class StreakRecord extends Model<StreakRecordAttributes, StreakRecordCreationAttributes> implements StreakRecordAttributes {
  public id!: number;
  public user_id!: number;
  public current_streak!: number;
  public best_streak!: number;
  public last_updated!: Date;
}

StreakRecord.init(
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
    current_streak: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    best_streak: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    last_updated: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'streak_records',
    timestamps: false,
  }
);

export default StreakRecord;
