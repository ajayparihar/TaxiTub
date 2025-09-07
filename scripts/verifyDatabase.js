// Verify database contents
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function verifyDatabase() {
  console.log('🔍 Verifying TaxiTub Database Contents');
  console.log('=====================================');
  
  try {
    // Get total count
    const { data: allCars, error } = await supabase.from('carinfo').select('carid, plateno, drivername, carmodel, seater');
    
    if (error) {
      console.error('❌ Error querying database:', error);
      return;
    }
    
    console.log(`📊 Total cars in database: ${allCars.length}`);
    
    if (allCars.length > 0) {
      // Show sample records
      console.log('\n🚗 Sample records:');
      allCars.slice(0, 5).forEach((car, index) => {
        console.log(`   ${index + 1}. ${car.plateno} - ${car.drivername} (${car.carmodel}, ${car.seater}-seater)`);
      });
      
      // Show seater distribution
      const seaterDist = allCars.reduce((acc, car) => {
        acc[car.seater] = (acc[car.seater] || 0) + 1;
        return acc;
      }, {});
      
      console.log('\n📈 Seater Distribution:');
      Object.entries(seaterDist).forEach(([seater, count]) => {
        const percentage = ((count / allCars.length) * 100).toFixed(1);
        console.log(`   ${seater}-seater: ${count} cars (${percentage}%)`);
      });
      
      // Show model distribution (top 10)
      const modelDist = allCars.reduce((acc, car) => {
        acc[car.carmodel] = (acc[car.carmodel] || 0) + 1;
        return acc;
      }, {});
      
      const topModels = Object.entries(modelDist)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
      
      console.log('\n🏎️  Top 10 Car Models:');
      topModels.forEach(([model, count]) => {
        console.log(`   ${model}: ${count} cars`);
      });
      
      // Check for duplicates
      const plateNumbers = allCars.map(car => car.plateno);
      const uniquePlates = new Set(plateNumbers);
      const duplicates = plateNumbers.length - uniquePlates.size;
      
      console.log(`\n🔗 Unique plate numbers: ${uniquePlates.size}`);
      if (duplicates > 0) {
        console.log(`⚠️  Duplicate plates: ${duplicates}`);
      } else {
        console.log('✅ All plate numbers are unique');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

verifyDatabase();
