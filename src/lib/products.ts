/**
 * Product and Category Constants
 * Used for compatibility with existing code
 * 
 * categories
1. Zircon rings
2. Plated rings
3. Steel rings
4. LOL rings
5. Streamlined plated bracelets
6. Zircon flow bracelets
7. Streamlined steel bracelets
8. Plated bracelets
9. Zirconia cuff bracelets
10. Steel bracelets
11. Painted smooth
12. Sloss zircon
13. Sloss Estelle
14. Painted silencers
15. Zircon stones
16. Akhras Steel
17. Plated anklet
18. Zirconia anklets
19. Steel anklets
20. Reins
21. Plated belt
22. Zircon belts
23. Pack it lol
24. Insaf Taqum lol
25. LOL fights
26. Indian lol kits
27. Local lol taqoomat
28. Half plated taqoum
29. Painted set
30. Farfasha painted set
31. Painted mukhawar taqumat
32. Hamat Ras
33. Lathem Zircon 
34. Lathm is painted
35. Then Estelle
36. Thin zircon sets
37. Zircon half rings
38. Bridal zircon ring
39. Taqum Estelle
40. Insaf Taqum Estelle
spechial categories
1. Customized silver name designs
2. Customized silver plated name designs
3. Customized gold name designs
4. Customized silver set designs
5. Customized silver plated set designs
6. Customized gold set designs
 */

export const CATEGORIES = [
  'Zircon rings',
  'Plated rings',
  'Steel rings',
  'LOL rings',
  'Streamlined plated bracelets',
  'Zircon flow bracelets',
  'Streamlined steel bracelets',
  'Plated bracelets',
  'Zirconia cuff bracelets',
  'Steel bracelets',
  'Painted smooth',
  'Sloss zircon',
  'Sloss Estelle',
  'Painted silencers',
  'Zircon stones',
  'Akhras Steel',
  'Plated anklet',
  'Zirconia anklets',
  'Steel anklets',
  'Reins',
  'Plated belt',
  'Zircon belts',
  'Pack it lol',
  'Insaf Taqum lol',
  'LOL fights',
  'Indian lol kits',
  'Local lol taqoomat',
  'Half plated taqoum',
  'Painted set',
  'Farfasha painted set',
  'Painted mukhawar taqumat',
  'Hamat Ras',
  'Lathem Zircon',
  'Lathm is painted',
  'Then Estelle',
  'Thin zircon sets',
  'Zircon half rings',
  'Bridal zircon ring',
  'Taqum Estelle',
  'Insaf Taqum Estelle',
  'Customized silver name designs',
  'Customized silver plated name designs',
  'Customized gold name designs',
  'Customized silver set designs',
  'Customized silver plated set designs',
  'Customized gold set designs'
] as const;

export type CategoryName = typeof CATEGORIES[number];
