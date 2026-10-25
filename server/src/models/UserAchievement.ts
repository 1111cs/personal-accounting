import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface UserAchievementAttributes {
  id: number;
  user_id: number;
  achievement_id: number;
  unlocked_at: Date;
}

interface UserAchievementCreationAttributes extends Optional<UserAchievementAttributes, 'id' | 'unlocked_at'> {}

class UserAchievement extends Model<UserAchievementAttributes, UserAchievementCreationAttributes> implements UserAchievementAttributes {
  public id!: number;
  public user_id!: number;
  public achievement_id!: number;
  public unlocked_at!: Date;
}

UserAchievement.init(
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
    achievement_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    unlocked_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'user_achievements',
    timestamps: false,
  }
);

export default UserAchievement;
