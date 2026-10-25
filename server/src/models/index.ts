import User from './User';
import Bill from './Bill';
import Budget from './Budget';
import SocialMode from './SocialMode';
import PriceRecord from './PriceRecord';
import Achievement from './Achievement';
import UserAchievement from './UserAchievement';
import StreakRecord from './StreakRecord';

// User - Bill: 一对多
User.hasMany(Bill, { foreignKey: 'user_id', as: 'bills' });
Bill.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// User - Budget: 一对多
User.hasMany(Budget, { foreignKey: 'user_id', as: 'budgets' });
Budget.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// User - SocialMode: 一对多
User.hasMany(SocialMode, { foreignKey: 'user_id', as: 'socialModes' });
SocialMode.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// User - PriceRecord: 一对多
User.hasMany(PriceRecord, { foreignKey: 'user_id', as: 'priceRecords' });
PriceRecord.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// User - Achievement: 多对多（通过 UserAchievement）
User.belongsToMany(Achievement, { through: UserAchievement, foreignKey: 'user_id', otherKey: 'achievement_id', as: 'achievements' });
Achievement.belongsToMany(User, { through: UserAchievement, foreignKey: 'achievement_id', otherKey: 'user_id', as: 'users' });

// User - StreakRecord: 一对一
User.hasOne(StreakRecord, { foreignKey: 'user_id', as: 'streakRecord' });
StreakRecord.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

export {
  User,
  Bill,
  Budget,
  SocialMode,
  PriceRecord,
  Achievement,
  UserAchievement,
  StreakRecord,
};
