// Quick script to create a test user
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    console.log('🔐 Creating test user...');
    
    const email = 'test@example.com';
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      console.log('✅ Test user already exists!');
      console.log('📧 Email:', email);
      console.log('🔑 Password:', password);
      return;
    }
    
    // Create test user
    const user = await prisma.user.create({
      data: {
        name: 'Test User',
        email: email,
        password: hashedPassword,
        company: 'Test Company'
      }
    });
    
    console.log('✅ Test user created successfully!');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('👤 User ID:', user.id);
    
  } catch (error) {
    console.error('❌ Error creating test user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
