// Database Seed Script
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // 1. Create Permissions
  console.log('📝 Creating permissions...');
  const permissions = await Promise.all([
    // POS permissions
    prisma.permission.upsert({
      where: { name: 'pos.create' },
      update: {},
      create: { name: 'pos.create', description: 'Create POS transactions' },
    }),
    prisma.permission.upsert({
      where: { name: 'pos.read' },
      update: {},
      create: { name: 'pos.read', description: 'View POS transactions' },
    }),
    prisma.permission.upsert({
      where: { name: 'pos.void' },
      update: {},
      create: { name: 'pos.void', description: 'Void POS transactions' },
    }),
    // Inventory permissions
    prisma.permission.upsert({
      where: { name: 'inventory.create' },
      update: {},
      create: { name: 'inventory.create', description: 'Create products' },
    }),
    prisma.permission.upsert({
      where: { name: 'inventory.edit' },
      update: {},
      create: { name: 'inventory.edit', description: 'Edit products' },
    }),
    prisma.permission.upsert({
      where: { name: 'inventory.delete' },
      update: {},
      create: { name: 'inventory.delete', description: 'Delete products' },
    }),
    prisma.permission.upsert({
      where: { name: 'inventory.adjust' },
      update: {},
      create: { name: 'inventory.adjust', description: 'Adjust stock levels' },
    }),
    // Reports permissions
    prisma.permission.upsert({
      where: { name: 'reports.view' },
      update: {},
      create: { name: 'reports.view', description: 'View reports' },
    }),
    prisma.permission.upsert({
      where: { name: 'reports.export' },
      update: {},
      create: { name: 'reports.export', description: 'Export reports' },
    }),
    // Admin permissions
    prisma.permission.upsert({
      where: { name: 'admin.users' },
      update: {},
      create: { name: 'admin.users', description: 'Manage users' },
    }),
    prisma.permission.upsert({
      where: { name: 'admin.settings' },
      update: {},
      create: { name: 'admin.settings', description: 'Manage settings' },
    }),
  ]);
  console.log(`✅ Created ${permissions.length} permissions\n`);

  // 2. Create Demo Tenant
  console.log('🏢 Creating demo tenant...');
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo-shop-abc123' },
    update: {},
    create: {
      name: 'Demo Coffee Shop',
      slug: 'demo-shop-abc123',
      businessType: 'retail',
      nipt: '1234567890',
      address: 'Rruga Myslym Shyri, Nr. 42',
      city: 'Tirana',
      country: 'AL',
      phone: '+355692345678',
      email: 'demo@coffeeshop.al',
      subscriptionPlan: 'professional',
      subscriptionStatus: 'active',
      trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });
  console.log(`✅ Created tenant: ${tenant.name}\n`);

  // 3. Create Roles
  console.log('👥 Creating roles...');
  const ownerRole = await prisma.role.upsert({
    where: { tenantId_name: { tenantId: tenant.id, name: 'owner' } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'owner',
      description: 'Business Owner - Full Access',
    },
  });

  const managerRole = await prisma.role.upsert({
    where: { tenantId_name: { tenantId: tenant.id, name: 'manager' } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'manager',
      description: 'Store Manager - Most Access',
    },
  });

  const cashierRole = await prisma.role.upsert({
    where: { tenantId_name: { tenantId: tenant.id, name: 'cashier' } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'cashier',
      description: 'Cashier - POS Only',
    },
  });
  console.log(`✅ Created 3 roles\n`);

  // 4. Assign Permissions to Roles
  console.log('🔐 Assigning permissions...');
  // Owner gets all permissions
  await Promise.all(
    permissions.map(p =>
      prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: ownerRole.id,
            permissionId: p.id,
          },
        },
        update: {},
        create: {
          roleId: ownerRole.id,
          permissionId: p.id,
        },
      })
    )
  );

  // Manager gets most permissions
  const managerPerms = permissions.filter(p => !p.name.startsWith('admin.users'));
  await Promise.all(
    managerPerms.map(p =>
      prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: managerRole.id,
            permissionId: p.id,
          },
        },
        update: {},
        create: {
          roleId: managerRole.id,
          permissionId: p.id,
        },
      })
    )
  );

  // Cashier gets POS permissions only
  const cashierPerms = permissions.filter(p => p.name.startsWith('pos.'));
  await Promise.all(
    cashierPerms.map(p =>
      prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: cashierRole.id,
            permissionId: p.id,
          },
        },
        update: {},
        create: {
          roleId: cashierRole.id,
          permissionId: p.id,
        },
      })
    )
  );
  console.log(`✅ Assigned permissions to roles\n`);

  // 5. Create Users
  console.log('👤 Creating users...');
  const passwordHash = await bcrypt.hash('password123', 12);

  const owner = await prisma.user.upsert({
    where: { email: 'owner@demo.com' },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'owner@demo.com',
      passwordHash,
      firstName: 'John',
      lastName: 'Doe',
      isActive: true,
      emailVerified: true,
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: 'manager@demo.com' },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'manager@demo.com',
      passwordHash,
      firstName: 'Jane',
      lastName: 'Smith',
      isActive: true,
      emailVerified: true,
    },
  });

  const cashier = await prisma.user.upsert({
    where: { email: 'cashier@demo.com' },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'cashier@demo.com',
      passwordHash,
      firstName: 'Bob',
      lastName: 'Johnson',
      isActive: true,
      emailVerified: true,
    },
  });
  console.log(`✅ Created 3 users (password: password123)\n`);

  // 6. Assign Users to Roles
  console.log('🔗 Assigning users to roles...');
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: owner.id, roleId: ownerRole.id } },
    update: {},
    create: { userId: owner.id, roleId: ownerRole.id },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: manager.id, roleId: managerRole.id } },
    update: {},
    create: { userId: manager.id, roleId: managerRole.id },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: cashier.id, roleId: cashierRole.id } },
    update: {},
    create: { userId: cashier.id, roleId: cashierRole.id },
  });
  console.log(`✅ Assigned users to roles\n`);

  // 7. Create Location
  console.log('📍 Creating location...');
  const location = await prisma.location.upsert({
    where: { id: 'demo-location-id' },
    update: {},
    create: {
      id: 'demo-location-id',
      tenantId: tenant.id,
      name: 'Main Store',
      type: 'store',
      address: 'Rruga Myslym Shyri, Nr. 42',
      city: 'Tirana',
      phone: '+355692345678',
      isActive: true,
    },
  });
  console.log(`✅ Created location: ${location.name}\n`);

  // 8. Create Categories
  console.log('📂 Creating categories...');
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { id: 'cat-beverages' },
      update: {},
      create: {
        id: 'cat-beverages',
        tenantId: tenant.id,
        name: 'Beverages',
        sortOrder: 1,
        isActive: true,
      },
    }),
    prisma.category.upsert({
      where: { id: 'cat-food' },
      update: {},
      create: {
        id: 'cat-food',
        tenantId: tenant.id,
        name: 'Food',
        sortOrder: 2,
        isActive: true,
      },
    }),
    prisma.category.upsert({
      where: { id: 'cat-snacks' },
      update: {},
      create: {
        id: 'cat-snacks',
        tenantId: tenant.id,
        name: 'Snacks',
        sortOrder: 3,
        isActive: true,
      },
    }),
  ]);
  console.log(`✅ Created ${categories.length} categories\n`);

  // 9. Create Products
  console.log('📦 Creating products...');
  const products = [
    {
      name: 'Espresso',
      categoryId: 'cat-beverages',
      sku: 'BEV-ESP-001',
      barcode: '1234567890001',
      costPrice: 0.50,
      sellingPrice: 1.50,
      taxRate: 20,
    },
    {
      name: 'Cappuccino',
      categoryId: 'cat-beverages',
      sku: 'BEV-CAP-001',
      barcode: '1234567890002',
      costPrice: 0.75,
      sellingPrice: 2.00,
      taxRate: 20,
    },
    {
      name: 'Latte',
      categoryId: 'cat-beverages',
      sku: 'BEV-LAT-001',
      barcode: '1234567890003',
      costPrice: 0.80,
      sellingPrice: 2.50,
      taxRate: 20,
    },
    {
      name: 'Americano',
      categoryId: 'cat-beverages',
      sku: 'BEV-AME-001',
      barcode: '1234567890004',
      costPrice: 0.60,
      sellingPrice: 1.80,
      taxRate: 20,
    },
    {
      name: 'Coca Cola 0.33L',
      categoryId: 'cat-beverages',
      sku: 'BEV-COK-033',
      barcode: '5449000000996',
      costPrice: 0.40,
      sellingPrice: 1.20,
      taxRate: 20,
    },
    {
      name: 'Water 0.5L',
      categoryId: 'cat-beverages',
      sku: 'BEV-WAT-050',
      barcode: '1234567890006',
      costPrice: 0.20,
      sellingPrice: 0.80,
      taxRate: 20,
    },
    {
      name: 'Croissant',
      categoryId: 'cat-food',
      sku: 'FOD-CRO-001',
      barcode: '1234567890007',
      costPrice: 0.50,
      sellingPrice: 1.50,
      taxRate: 20,
    },
    {
      name: 'Sandwich - Ham & Cheese',
      categoryId: 'cat-food',
      sku: 'FOD-SAN-001',
      barcode: '1234567890008',
      costPrice: 1.50,
      sellingPrice: 3.50,
      taxRate: 20,
    },
    {
      name: 'Muffin - Chocolate',
      categoryId: 'cat-food',
      sku: 'FOD-MUF-001',
      barcode: '1234567890009',
      costPrice: 0.60,
      sellingPrice: 1.80,
      taxRate: 20,
    },
    {
      name: 'Chips - Lay\'s Classic',
      categoryId: 'cat-snacks',
      sku: 'SNK-CHP-001',
      barcode: '1234567890010',
      costPrice: 0.50,
      sellingPrice: 1.50,
      taxRate: 20,
    },
  ];

  for (const p of products) {
    // Check if product exists
    const existing = await prisma.product.findFirst({
      where: {
        tenantId: tenant.id,
        barcode: p.barcode,
      },
    });

    const product = existing || await prisma.product.create({
      data: {
        tenantId: tenant.id,
        ...p,
      },
    });

    // Create initial stock
    await prisma.stock.upsert({
      where: {
        productId_locationId: {
          productId: product.id,
          locationId: location.id,
        },
      },
      update: {},
      create: {
        tenantId: tenant.id,
        productId: product.id,
        locationId: location.id,
        quantity: 100,
        lowStockThreshold: 10,
      },
    });
  }
  console.log(`✅ Created ${products.length} products with initial stock\n`);

  // 10. Create Sample Customers
  console.log('👥 Creating sample customers...');
  const customers = await Promise.all([
    prisma.customer.upsert({
      where: { id: 'cust-001' },
      update: {},
      create: {
        id: 'cust-001',
        tenantId: tenant.id,
        firstName: 'Alice',
        lastName: 'Brown',
        email: 'alice@example.com',
        phone: '+355691111111',
        loyaltyPoints: 150,
      },
    }),
    prisma.customer.upsert({
      where: { id: 'cust-002' },
      update: {},
      create: {
        id: 'cust-002',
        tenantId: tenant.id,
        firstName: 'Charlie',
        lastName: 'Davis',
        phone: '+355692222222',
        loyaltyPoints: 50,
      },
    }),
  ]);
  console.log(`✅ Created ${customers.length} sample customers\n`);

  console.log('🎉 Database seeded successfully!\n');
  console.log('📝 Login credentials:');
  console.log('   Owner:   owner@demo.com / password123');
  console.log('   Manager: manager@demo.com / password123');
  console.log('   Cashier: cashier@demo.com / password123');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
