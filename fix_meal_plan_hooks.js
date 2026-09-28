const fs = require('fs');
const path = 'C:/Users/A_bisoye/Desktop/REPForge-phase7-formcheck/components/MealPlanView/index.js';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  "import { useState } from 'react';",
  "import { useState, useEffect } from 'react';"
);

const badHooks = `  import('react').then((React) => {
    React.useEffect(() => {
      const saved = localStorage.getItem('temprfit_ai_plan_day');
      if (saved) setOpenDay(parseInt(saved) || 1);
    }, []);
    React.useEffect(() => {
      localStorage.setItem('temprfit_ai_plan_day', openDay);
    }, [openDay]);
  });`;

const goodHooks = `  useEffect(() => {
    const saved = localStorage.getItem('temprfit_ai_plan_day');
    if (saved) setOpenDay(parseInt(saved) || 1);
  }, []);

  useEffect(() => {
    localStorage.setItem('temprfit_ai_plan_day', openDay);
  }, [openDay]);`;

content = content.replace(badHooks, goodHooks);

fs.writeFileSync(path, content, 'utf8');
console.log("Fixed MealPlanView hooks");
