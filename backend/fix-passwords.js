const { User } = require('./src/models');
const bcrypt = require('bcryptjs');

(async () => {
  const passwords = {
    'admin': 'admin123',
    'deptadmin': 'dept123',
    'user1': 'user123',
    'user2': 'user123'
  };

  for (const [username, password] of Object.entries(passwords)) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [updated] = await User.update({ password: hashedPassword }, { where: { username } });
    
    const user = await User.findOne({ where: { username } });
    const match = await user.comparePassword(password);
    console.log(username, 'updated:', updated, 'verify:', match);
  }

  process.exit(0);
})();
