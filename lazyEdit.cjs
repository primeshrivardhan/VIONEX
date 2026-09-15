const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf8');

const importsToReplace = [
  "import DealersView from \"./components/DealersView\";",
  "import Dashboard from \"./components/Dashboard\";",
  "import AddCrop from \"./components/AddCrop\";",
  "import AdvisoryView from \"./components/AdvisoryView\";",
  "import AlertsView from \"./components/AlertsView\";",
  "import AddFarmerForm from \"./components/AddFarmerForm\";",
  "import FarmerList from \"./components/FarmerList\";",
  "import AddProductForm from \"./components/AddProductForm\";",
  "import ProductList from \"./components/ProductList\";",
  "import AddScheduleForm from \"./components/AddScheduleForm\";",
  "import ScheduleList from \"./components/ScheduleList\";",
  "import ConsultantsView from \"./components/ConsultantsView\";",
  "import MasterScheduleView from \"./components/MasterScheduleView\";",
  "import LocationMapping from \"./components/LocationMapping\";",
  "import AdminView from \"./components/AdminView\";",
  "import SettingsView from \"./components/SettingsView\";",
  "import NeutralPublicPortal from \"./components/NeutralPublicPortal\";",
];

importsToReplace.forEach(imp => {
  code = code.replace(imp, "");
});

code = code.replace(
  'import { useState, useEffect, useMemo, useRef, useCallback } from "react";',
  'import React, { useState, useEffect, useMemo, useRef, useCallback, Suspense } from "react";\n' +
  'const DealersView = React.lazy(() => import("./components/DealersView"));\n' +
  'const Dashboard = React.lazy(() => import("./components/Dashboard"));\n' +
  'const AddCrop = React.lazy(() => import("./components/AddCrop"));\n' +
  'const AdvisoryView = React.lazy(() => import("./components/AdvisoryView"));\n' +
  'const AlertsView = React.lazy(() => import("./components/AlertsView"));\n' +
  'const AddFarmerForm = React.lazy(() => import("./components/AddFarmerForm"));\n' +
  'const FarmerList = React.lazy(() => import("./components/FarmerList"));\n' +
  'const AddProductForm = React.lazy(() => import("./components/AddProductForm"));\n' +
  'const ProductList = React.lazy(() => import("./components/ProductList"));\n' +
  'const AddScheduleForm = React.lazy(() => import("./components/AddScheduleForm"));\n' +
  'const ScheduleList = React.lazy(() => import("./components/ScheduleList"));\n' +
  'const ConsultantsView = React.lazy(() => import("./components/ConsultantsView"));\n' +
  'const MasterScheduleView = React.lazy(() => import("./components/MasterScheduleView"));\n' +
  'const LocationMapping = React.lazy(() => import("./components/LocationMapping"));\n' +
  'const AdminView = React.lazy(() => import("./components/AdminView"));\n' +
  'const SettingsView = React.lazy(() => import("./components/SettingsView"));\n' +
  'const NeutralPublicPortal = React.lazy(() => import("./components/NeutralPublicPortal"));\n'
);

const suspenseWrapper = `          <Suspense fallback={<div className="flex justify-center p-8"><div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div></div>>`;

// We also need to add <Suspense> wrapping the components.
// We can just wrap the whole conditional rendering section in one Suspense.
// Let's replace:
//        {/* Main Content Area */}
//        <div className={`p-4 md:p-6 lg:p-8 max-w-7xl mx-auto transition-opacity duration-300 ${isTransitioning ? "opacity-0" : "opacity-100"}`}>
// with:
//        {/* Main Content Area */}
//        <div className={`p-4 md:p-6 lg:p-8 max-w-7xl mx-auto transition-opacity duration-300 ${isTransitioning ? "opacity-0" : "opacity-100"}`}>
//          <Suspense fallback={<div className="flex justify-center items-center h-64"><div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div></div>}>

code = code.replace(
  '{/* Main Content Area */}\n        <div className={`p-4 md:p-6 lg:p-8 max-w-7xl mx-auto transition-opacity duration-300 ${isTransitioning ? "opacity-0" : "opacity-100"}`}>',
  '{/* Main Content Area */}\n        <div className={`p-4 md:p-6 lg:p-8 max-w-7xl mx-auto transition-opacity duration-300 ${isTransitioning ? "opacity-0" : "opacity-100"}`}>\n          <Suspense fallback={<div className="flex justify-center items-center h-64"><div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div></div>}>'
);

code = code.replace(
  '        </div>\n\n        {/* Mobile Navigation Spacer */}',
  '          </Suspense>\n        </div>\n\n        {/* Mobile Navigation Spacer */}'
);

fs.writeFileSync('src/App.tsx', code);
