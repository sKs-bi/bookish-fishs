const { User, Department } = require('./src/models');
const bcrypt = require('bcryptjs');

(async () => {
  const depts = await Department.findAll();
  const dept1 = depts.find(d => d.code === 'XXGC');
  const dept2 = depts.find(d => d.code === 'JSJKX');

  const users = [
    { username: 'deptadmin', password: 'dept123', real_name: '张部门', role: 'dept_admin', department_id: dept1?.id || 1, status: 'active' },
    { username: 'user1', password: 'user123', real_name: '李普通', role: 'normal_user', department_id: dept1?.id || 1, status: 'active' },
    { username: 'user2', password: 'user123', real_name: '王同学', role: 'normal_user', department_id: dept2?.id || 2, status: 'active' },
  ];

  for (const u of users) {
    const exists = await User.findOne({ where: { username: u.username } });
    if (!exists) {
      u.password = await bcrypt.hash(u.password, 10);
      await User.create(u);
      console.log('Created:', u.username, u.role);
    } else {
      console.log('Exists:', u.username);
    }
  }

  const all = await User.findAll({ attributes: ['username', 'real_name', 'role', 'status'] });
  console.log('\nAll users:');
  all.forEach(u => console.log('  ', u.username, u.real_name, u.role, u.status));

  process.exit(0);
})();
