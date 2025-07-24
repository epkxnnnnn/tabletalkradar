#!/usr/bin/env node

// TableTalk Radar - Source Code Architecture Improvement Script
const fs = require('fs');
const path = require('path');

console.log('🏗️  TableTalk Radar - Architecture Improvement Analysis');
console.log('====================================================');

// Analyze current src/ structure
function analyzeSourceStructure() {
  const srcPath = path.join(__dirname, 'src');
  
  console.log('📊 Current Source Structure Analysis:');
  
  // Analyze components
  const componentsPath = path.join(srcPath, 'components');
  if (fs.existsSync(componentsPath)) {
    const components = fs.readdirSync(componentsPath).filter(f => f.endsWith('.tsx'));
    console.log(`   📁 Components: ${components.length} files`);
    
    // Categorize components by type
    const authComponents = components.filter(c => c.includes('Auth') || c.includes('Login') || c.includes('Signup'));
    const clientComponents = components.filter(c => c.includes('Client'));
    const dashboardComponents = components.filter(c => c.includes('Dashboard'));
    const providerComponents = components.filter(c => c.includes('Provider'));
    const uiComponents = components.filter(c => ['Button', 'Toast', 'Modal', 'Spinner'].some(ui => c.includes(ui)));
    
    console.log(`      🔐 Auth-related: ${authComponents.length}`);
    console.log(`      👥 Client-related: ${clientComponents.length}`);
    console.log(`      📊 Dashboard-related: ${dashboardComponents.length}`);
    console.log(`      🔌 Providers: ${providerComponents.length}`);
    console.log(`      🎨 UI Components: ${uiComponents.length}`);
    console.log(`      📦 Other: ${components.length - authComponents.length - clientComponents.length - dashboardComponents.length - providerComponents.length - uiComponents.length}`);
  }
  
  // Analyze API routes
  const apiPath = path.join(srcPath, 'app', 'api');
  if (fs.existsSync(apiPath)) {
    const apiRoutes = getAllFiles(apiPath, '.ts').filter(f => f.includes('route.ts'));
    console.log(`   🌐 API Routes: ${apiRoutes.length} endpoints`);
    
    // Categorize API routes
    const authRoutes = apiRoutes.filter(r => r.includes('/auth/'));
    const clientRoutes = apiRoutes.filter(r => r.includes('/client'));
    const adminRoutes = apiRoutes.filter(r => r.includes('/admin/'));
    const googleRoutes = apiRoutes.filter(r => r.includes('/google-business/'));
    
    console.log(`      🔐 Auth routes: ${authRoutes.length}`);
    console.log(`      👥 Client routes: ${clientRoutes.length}`);
    console.log(`      👑 Admin routes: ${adminRoutes.length}`);
    console.log(`      📍 Google Business routes: ${googleRoutes.length}`);
  }
  
  // Analyze lib utilities
  const libPath = path.join(srcPath, 'lib');
  if (fs.existsSync(libPath)) {
    const libFiles = fs.readdirSync(libPath).filter(f => f.endsWith('.ts'));
    console.log(`   📚 Library files: ${libFiles.length}`);
    
    const aiFiles = libFiles.filter(f => f.includes('ai') || f.includes('qwen'));
    const authFiles = libFiles.filter(f => f.includes('auth') || f.includes('supabase'));
    const businessFiles = libFiles.filter(f => f.includes('business') || f.includes('google'));
    
    console.log(`      🤖 AI-related: ${aiFiles.length}`);
    console.log(`      🔐 Auth-related: ${authFiles.length}`);
    console.log(`      🏢 Business-related: ${businessFiles.length}`);
  }
}

// Get all files recursively
function getAllFiles(dir, extension) {
  let files = [];
  if (!fs.existsSync(dir)) return files;
  
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files = files.concat(getAllFiles(fullPath, extension));
    } else if (item.endsWith(extension)) {
      files.push(fullPath);
    }
  }
  return files;
}

// Analyze code quality issues
function analyzeCodeQuality() {
  console.log('\n🔍 Code Quality Analysis:');
  
  const srcPath = path.join(__dirname, 'src');
  const tsFiles = getAllFiles(srcPath, '.ts').concat(getAllFiles(srcPath, '.tsx'));
  
  console.log(`   📁 Total TypeScript files: ${tsFiles.length}`);
  
  let issues = {
    anyTypes: 0,
    longFunctions: 0,
    deepNesting: 0,
    missingTypes: 0,
    duplicateCode: 0
  };
  
  for (const file of tsFiles) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for 'any' types
      const anyMatches = content.match(/:\s*any\b/g);
      if (anyMatches) issues.anyTypes += anyMatches.length;
      
      // Check for long functions (over 50 lines)
      const functions = content.match(/function\s+\w+[^{]*{[\s\S]*?}(?=\s*(?:function|\w+\s*[:=]|export|const|let|var|$))/g) || [];
      const longFunctions = functions.filter(fn => fn.split('\n').length > 50);
      issues.longFunctions += longFunctions.length;
      
      // Check for deep nesting (more than 4 levels)
      const lines = content.split('\n');
      for (const line of lines) {
        const indentLevel = (line.match(/^[\s]*/)[0].length / 2);
        if (indentLevel > 4) issues.deepNesting++;
      }
      
    } catch (error) {
      // Skip files that can't be read
    }
  }
  
  console.log(`   ⚠️  'any' types found: ${issues.anyTypes}`);
  console.log(`   📏 Long functions (>50 lines): ${issues.longFunctions}`);
  console.log(`   🔄 Deep nesting instances: ${issues.deepNesting}`);
}

// Generate improvement recommendations
function generateRecommendations() {
  console.log('\n💡 Architecture Improvement Recommendations:');
  console.log('===========================================');
  
  console.log('\n1. 📦 Component Organization:');
  console.log('   ✅ Move auth components to src/components/features/auth/');
  console.log('   ✅ Move client components to src/components/features/clients/');
  console.log('   ✅ Create src/components/ui/ for reusable UI components');
  console.log('   ✅ Move providers to src/components/providers/');
  
  console.log('\n2. 🌐 API Route Organization:');
  console.log('   ✅ Group related routes in feature directories');
  console.log('   ✅ Add consistent error handling middleware');
  console.log('   ✅ Implement request/response type safety');
  console.log('   ✅ Add API documentation with OpenAPI');
  
  console.log('\n3. 📚 Library Structure:');
  console.log('   ✅ Create src/lib/api/ for API client functions');
  console.log('   ✅ Move auth logic to src/lib/auth/');
  console.log('   ✅ Create src/lib/integrations/ for third-party services');
  console.log('   ✅ Add src/lib/utils/ for shared utilities');
  
  console.log('\n4. 🔧 TypeScript Improvements:');
  console.log('   ✅ Enable strict mode in tsconfig.json');
  console.log('   ✅ Replace "any" types with proper interfaces');
  console.log('   ✅ Add runtime type validation with Zod');
  console.log('   ✅ Create shared type definitions');
  
  console.log('\n5. 🧪 Testing Strategy:');
  console.log('   ✅ Add unit tests for all utility functions');
  console.log('   ✅ Add integration tests for API routes');
  console.log('   ✅ Add component tests with React Testing Library');
  console.log('   ✅ Add E2E tests for critical user flows');
  
  console.log('\n6. 📈 Performance Optimizations:');
  console.log('   ✅ Implement React.memo for expensive components');
  console.log('   ✅ Add useMemo and useCallback where appropriate');
  console.log('   ✅ Implement code splitting with dynamic imports');
  console.log('   ✅ Optimize bundle size with webpack analysis');
  
  console.log('\n7. 🔒 Security Improvements:');
  console.log('   ✅ Implement proper input validation');
  console.log('   ✅ Add rate limiting to API routes');
  console.log('   ✅ Secure environment variable handling');
  console.log('   ✅ Implement proper error boundaries');
}

// Create improvement script template
function createImprovementTemplate() {
  const template = `
# TableTalk Radar - Architecture Improvement Checklist

## Phase 1: Component Organization
- [ ] Create feature-based component directories
- [ ] Move auth components to features/auth/
- [ ] Move client components to features/clients/
- [ ] Extract reusable UI components
- [ ] Organize provider components

## Phase 2: API Structure
- [ ] Group API routes by feature
- [ ] Add consistent error handling
- [ ] Implement type-safe API responses
- [ ] Add API documentation

## Phase 3: TypeScript Enhancement
- [ ] Enable strict mode
- [ ] Replace any types with interfaces
- [ ] Add runtime validation
- [ ] Create shared type definitions

## Phase 4: Testing Implementation
- [ ] Set up Jest and React Testing Library
- [ ] Add unit tests for utilities
- [ ] Add integration tests for APIs
- [ ] Add component tests
- [ ] Set up E2E testing

## Phase 5: Performance Optimization
- [ ] Implement React optimization patterns
- [ ] Add code splitting
- [ ] Optimize bundle size
- [ ] Add performance monitoring

## Phase 6: Security & Quality
- [ ] Add input validation
- [ ] Implement rate limiting
- [ ] Add error boundaries
- [ ] Set up code quality tools
`;

  fs.writeFileSync('ARCHITECTURE_IMPROVEMENTS.md', template);
  console.log('\n📋 Created ARCHITECTURE_IMPROVEMENTS.md checklist');
}

// Main execution
function main() {
  analyzeSourceStructure();
  analyzeCodeQuality();
  generateRecommendations();
  createImprovementTemplate();
  
  console.log('\n🎯 Next Steps:');
  console.log('   1. Run the refactor.sh script to organize files');
  console.log('   2. Follow the ARCHITECTURE_IMPROVEMENTS.md checklist');
  console.log('   3. Implement TypeScript strict mode');
  console.log('   4. Add comprehensive testing');
  console.log('   5. Optimize performance and security');
  
  console.log('\n📞 Ready to implement these improvements with Qwen3 assistance!');
}

if (require.main === module) {
  main();
}

module.exports = {
  analyzeSourceStructure,
  analyzeCodeQuality,
  generateRecommendations
};