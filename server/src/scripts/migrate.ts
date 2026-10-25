import { DataTypes } from 'sequelize';
import sequelize from '../config/database';
import '../models/index';

async function migrate() {
  try {
    await sequelize.authenticate();

    // 首次部署时创建模型声明的表；后续结构调整在本脚本中显式执行。
    await sequelize.sync();

    const queryInterface = sequelize.getQueryInterface();
    const bills = await queryInterface.describeTable('bills');

    if (!bills.source) {
      await queryInterface.addColumn('bills', 'source', {
        type: DataTypes.ENUM('daily', 'reserve'),
        allowNull: true,
        defaultValue: 'daily',
      });
    }

    await sequelize.query("UPDATE bills SET source = 'daily' WHERE source IS NULL");
    console.log('数据库迁移完成');
    process.exit(0);
  } catch (error) {
    console.error('数据库迁移失败:', error);
    process.exit(1);
  }
}

migrate();
