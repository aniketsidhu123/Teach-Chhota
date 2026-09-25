import { db, chaptersTable, chapterChunksTable } from "@workspace/db";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const seedData = [
  {
    classLevel: 6,
    subject: "Maths",
    title: "Knowing Our Numbers",
    content: "In this chapter, we learn about large numbers, Indian and International system of numeration, estimation, and Roman numerals. Estimation involves rounding off numbers to the nearest tens, hundreds, or thousands to get a rough idea. The Indian system uses Lakhs and Crores, while the International system uses Millions and Billions.",
  },
  {
    classLevel: 6,
    subject: "Maths",
    title: "Whole Numbers",
    content: "The natural numbers along with zero form the collection of whole numbers. Properties of whole numbers include closure, commutativity, associativity, and distributivity for addition and multiplication. Division by zero is not defined.",
  },
  {
    classLevel: 6,
    subject: "Maths",
    title: "Playing With Numbers",
    content: "This chapter introduces factors, multiples, prime and composite numbers. It covers divisibility tests for 2, 3, 4, 5, 6, 8, 9, 10, and 11. It also explains Highest Common Factor (HCF) and Lowest Common Multiple (LCM).",
  },
  {
    classLevel: 6,
    subject: "Science",
    title: "Components of Food",
    content: "Food consists of essential components called nutrients: carbohydrates, proteins, fats, vitamins, and minerals. Dietary fibres and water are also crucial. Deficiency of these nutrients leads to deficiency diseases like scurvy (Vitamin C), goiter (Iodine), and anemia (Iron).",
  },
  {
    classLevel: 6,
    subject: "Science",
    title: "Sorting Materials into Groups",
    content: "Materials are grouped based on properties such as appearance (lustrous/non-lustrous), hardness, solubility in water, buoyancy, and transparency (transparent, translucent, opaque). Grouping makes it easier to study their properties.",
  },
  {
    classLevel: 6,
    subject: "Science",
    title: "Separation of Substances",
    content: "Substances are separated using methods like handpicking, winnowing, sieving, sedimentation, decantation, and filtration. Evaporation and condensation are used for separating a soluble solid from a liquid.",
  },
  {
    classLevel: 10,
    subject: "Maths",
    title: "Real Numbers",
    content: "This chapter covers Euclid's Division Lemma, the Fundamental Theorem of Arithmetic, and proving irrationality of numbers like root 2 and root 3. It explores the decimal expansion of rational numbers (terminating or non-terminating repeating).",
  },
  {
    classLevel: 10,
    subject: "Maths",
    title: "Polynomials",
    content: "Polynomials of degrees 1, 2, and 3 are called linear, quadratic, and cubic polynomials respectively. The geometrical meaning of the zeroes of a polynomial is discussed, along with the relationship between zeroes and coefficients of quadratic polynomials.",
  },
  {
    classLevel: 10,
    subject: "Maths",
    title: "Quadratic Equations",
    content: "A quadratic equation is in the form ax^2 + bx + c = 0. Methods to solve it include factorization, completing the square, and using the quadratic formula. The discriminant (b^2 - 4ac) determines the nature of the roots.",
  },
  {
    classLevel: 10,
    subject: "Science",
    title: "Chemical Reactions and Equations",
    content: "A chemical equation represents a chemical reaction. Types of reactions include combination, decomposition, displacement, double displacement, and oxidation-reduction (redox) reactions. Balancing chemical equations is based on the law of conservation of mass.",
  },
  {
    classLevel: 10,
    subject: "Science",
    title: "Acids, Bases and Salts",
    content: "Acids are sour, turn blue litmus red, and release H+ ions. Bases are bitter, turn red litmus blue, and release OH- ions. The pH scale measures hydrogen ion concentration. Neutralization is the reaction between an acid and a base to form salt and water.",
  },
  {
    classLevel: 10,
    subject: "Science",
    title: "Metals and Non-metals",
    content: "Metals are generally hard, lustrous, malleable, ductile, good conductors, and sonorous. Non-metals are the opposite. The reactivity series lists metals in decreasing order of reactivity. Ionic bonds are formed by the transfer of electrons from metals to non-metals.",
  },
  // Class 7
  {
    classLevel: 7,
    subject: "Maths",
    title: "Integers",
    content: "Integers include positive numbers, negative numbers, and zero. Addition and subtraction of integers follow specific rules: adding two positive integers gives a positive integer, adding two negative integers gives a negative integer. Multiplication and division of integers follow sign rules: positive × positive = positive, negative × negative = positive, positive × negative = negative.",
  },
  {
    classLevel: 7,
    subject: "Maths",
    title: "Fractions and Decimals",
    content: "Fractions represent parts of a whole. Proper fractions have numerator less than denominator. Improper fractions have numerator greater than or equal to denominator. Mixed fractions combine whole numbers with proper fractions. Operations on fractions include addition, subtraction, multiplication, and division. Decimals are another way to represent fractions with denominators as powers of 10.",
  },
  {
    classLevel: 7,
    subject: "Maths",
    title: "Algebraic Expressions",
    content: "An algebraic expression is a combination of constants and variables connected by operations like addition, subtraction, multiplication, and division. Terms are the building blocks of expressions. Like terms have the same variable raised to the same power. Addition and subtraction of algebraic expressions involve combining like terms.",
  },
  {
    classLevel: 7,
    subject: "Science",
    title: "Nutrition in Plants",
    content: "Plants make their own food through photosynthesis using sunlight, carbon dioxide, and water in the presence of chlorophyll. The equation is: Carbon dioxide + Water → Glucose + Oxygen. Some plants are parasitic (Cuscuta), insectivorous (Venus flytrap), or saprophytic (fungi). Symbiotic relationships like lichens involve algae and fungi living together.",
  },
  {
    classLevel: 7,
    subject: "Science",
    title: "Heat",
    content: "Heat is a form of energy that flows from a hotter body to a cooler body. Temperature measures the degree of hotness. Heat transfers through conduction (solids), convection (liquids and gases), and radiation (no medium needed). Conductors allow heat to pass through them easily, while insulators do not.",
  },
  {
    classLevel: 7,
    subject: "Science",
    title: "Acids, Bases and Indicators",
    content: "Acids taste sour and turn blue litmus red. Bases taste bitter and turn red litmus blue. Natural indicators like turmeric, litmus, and China rose can test whether a substance is acidic or basic. Neutralization occurs when an acid and base react to form salt and water. Rainwater mixed with sulphur dioxide or nitrogen oxide forms acid rain.",
  },
  // Class 8
  {
    classLevel: 8,
    subject: "Maths",
    title: "Rational Numbers",
    content: "Rational numbers are numbers that can be expressed as p/q where q is not zero. They include integers, fractions, and terminating or repeating decimals. Properties include closure, commutativity, and associativity for addition and multiplication. The additive identity is 0 and the multiplicative identity is 1. Between any two rational numbers, there exist infinitely many rational numbers.",
  },
  {
    classLevel: 8,
    subject: "Maths",
    title: "Linear Equations in One Variable",
    content: "A linear equation in one variable has the highest power of the variable as 1. To solve, isolate the variable by performing the same operations on both sides. Applications include age problems, number problems, and geometry problems. Cross-multiplication is used when the equation involves fractions.",
  },
  {
    classLevel: 8,
    subject: "Maths",
    title: "Squares and Square Roots",
    content: "The square of a number is the product of the number with itself. Perfect squares end in 0, 1, 4, 5, 6, or 9. Square root is the inverse operation of squaring. Methods to find square roots include prime factorization and long division. The square root of a product equals the product of square roots.",
  },
  {
    classLevel: 8,
    subject: "Science",
    title: "Force and Pressure",
    content: "A force is a push or pull that can change the state of motion, shape, or direction of an object. Pressure is force per unit area. Atmospheric pressure is the pressure exerted by air. Liquids exert pressure on the walls and bottom of a container. Pressure in liquids increases with depth.",
  },
  {
    classLevel: 8,
    subject: "Science",
    title: "Cell - Structure and Functions",
    content: "The cell is the basic structural and functional unit of life. Cells were discovered by Robert Hooke. Prokaryotic cells lack a nuclear membrane (bacteria), while eukaryotic cells have a well-defined nucleus. Plant cells have a cell wall, chloroplasts, and large vacuoles. Animal cells have centrioles. Both have cell membrane, cytoplasm, nucleus, mitochondria, and ribosomes.",
  },
  {
    classLevel: 8,
    subject: "Science",
    title: "Chemical Effects of Electric Current",
    content: "Some liquids conduct electricity and are called conducting solutions or electrolytes. The passage of electric current through a conducting liquid causes chemical reactions called electrolysis. Electroplating is coating a metal object with a thin layer of another metal using electrolysis. Applications include chrome plating, tin cans, and gold/silver jewelry coating.",
  },
  // Class 9
  {
    classLevel: 9,
    subject: "Maths",
    title: "Number Systems",
    content: "The number system includes natural numbers, whole numbers, integers, rational numbers, and irrational numbers. Together, rational and irrational numbers make up real numbers. Irrational numbers like √2, √3, and π have non-terminating, non-repeating decimal expansions. Laws of exponents apply to real numbers. Rationalizing the denominator involves removing surds from the denominator.",
  },
  {
    classLevel: 9,
    subject: "Maths",
    title: "Polynomials",
    content: "A polynomial in one variable is an algebraic expression of the form a₀ + a₁x + a₂x² + ... + aₙxⁿ. The degree is the highest power of the variable. Factor theorem states that (x-a) is a factor of p(x) if p(a) = 0. Remainder theorem states that when p(x) is divided by (x-a), the remainder is p(a). Important identities include (a+b)² = a² + 2ab + b² and (a+b+c)² = a² + b² + c² + 2ab + 2bc + 2ca.",
  },
  {
    classLevel: 9,
    subject: "Maths",
    title: "Coordinate Geometry",
    content: "The Cartesian plane is formed by two perpendicular number lines: the x-axis (horizontal) and y-axis (vertical). Their intersection is the origin (0,0). The plane is divided into four quadrants. Any point is represented as an ordered pair (x, y). The x-coordinate is called the abscissa and the y-coordinate is called the ordinate.",
  },
  {
    classLevel: 9,
    subject: "Science",
    title: "Matter in Our Surroundings",
    content: "Matter is anything that occupies space and has mass. It exists in three states: solid, liquid, and gas. Solids have fixed shape and volume. Liquids have fixed volume but no fixed shape. Gases have neither fixed shape nor volume. Changes of state include melting, boiling, evaporation, condensation, and sublimation. Latent heat is the heat absorbed without changing temperature during a state change.",
  },
  {
    classLevel: 9,
    subject: "Science",
    title: "The Fundamental Unit of Life",
    content: "The cell is the fundamental unit of life. All organisms are made of cells. Cell theory states that all living organisms are composed of cells. The plasma membrane is selectively permeable. Osmosis is the movement of water from a region of high concentration to low concentration through a semipermeable membrane. The nucleus contains DNA which controls cell activities. Mitochondria are the powerhouse of the cell.",
  },
  {
    classLevel: 9,
    subject: "Science",
    title: "Motion",
    content: "Motion is the change in position of an object with time. Distance is the total path length, while displacement is the shortest distance between initial and final positions. Speed is distance per unit time, velocity is displacement per unit time. Acceleration is the rate of change of velocity. Equations of motion: v = u + at, s = ut + ½at², v² = u² + 2as. Uniform circular motion has constant speed but changing direction.",
  },
  // Class 11
  {
    classLevel: 11,
    subject: "Maths",
    title: "Sets",
    content: "A set is a well-defined collection of objects. Sets are represented in roster form or set-builder form. Types include empty set, finite set, infinite set, equal sets, and universal set. Operations include union, intersection, difference, and complement. Venn diagrams visually represent set relationships. De Morgan's laws state: (A∪B)' = A'∩B' and (A∩B)' = A'∪B'.",
  },
  {
    classLevel: 11,
    subject: "Maths",
    title: "Trigonometric Functions",
    content: "Trigonometric functions extend the ratios from right-angled triangles to all angles. The unit circle defines sin, cos, and tan for any angle. Radian measure: π radians = 180°. Key identities include sin²θ + cos²θ = 1, 1 + tan²θ = sec²θ, 1 + cot²θ = cosec²θ. Sum and difference formulas: sin(A±B) = sinAcosB ± cosAsinB. The graphs of trigonometric functions are periodic.",
  },
  {
    classLevel: 11,
    subject: "Maths",
    title: "Limits and Derivatives",
    content: "A limit describes the value a function approaches as the input approaches a certain value. The derivative of a function at a point is the slope of the tangent to its graph. The derivative of f(x) = xⁿ is nxⁿ⁻¹. Product rule: d/dx[f(x)g(x)] = f'(x)g(x) + f(x)g'(x). Quotient rule: d/dx[f(x)/g(x)] = [f'(x)g(x) - f(x)g'(x)] / [g(x)]². Limits are foundational to calculus.",
  },
  {
    classLevel: 11,
    subject: "Science",
    title: "Laws of Motion",
    content: "Newton's First Law (Inertia): An object remains at rest or in uniform motion unless acted upon by a net external force. Newton's Second Law: F = ma, force equals mass times acceleration. Newton's Third Law: For every action, there is an equal and opposite reaction. Friction opposes relative motion between surfaces. Types of friction include static, kinetic, and rolling friction. Momentum is the product of mass and velocity.",
  },
  {
    classLevel: 11,
    subject: "Science",
    title: "Chemical Bonding and Molecular Structure",
    content: "Chemical bonds form to achieve a stable electron configuration. Ionic bonds form by transfer of electrons between metals and non-metals. Covalent bonds form by sharing of electrons. The octet rule states atoms tend to have eight electrons in their valence shell. VSEPR theory predicts molecular geometry based on electron pair repulsion. Hybridization explains the geometry of molecules: sp (linear), sp2 (trigonal planar), sp3 (tetrahedral).",
  },
  {
    classLevel: 11,
    subject: "Science",
    title: "Structure of Atom",
    content: "Atoms consist of protons, neutrons, and electrons. Thomson's plum pudding model was replaced by Rutherford's nuclear model after the gold foil experiment. Bohr's model explained hydrogen's line spectrum with quantized energy levels. Quantum mechanical model uses orbitals (s, p, d, f) to describe electron probability. Aufbau principle, Pauli exclusion principle, and Hund's rule govern electron filling order. Quantum numbers (n, l, ml, ms) describe each electron uniquely.",
  },
  // Class 12
  {
    classLevel: 12,
    subject: "Maths",
    title: "Relations and Functions",
    content: "A relation from set A to set B is a subset of A×B. Types of relations include reflexive, symmetric, transitive, and equivalence relations. A function is a special relation where each element of the domain maps to exactly one element of the codomain. Types of functions include one-one (injective), onto (surjective), and bijective. Composition of functions: (fog)(x) = f(g(x)). Inverse of a bijective function exists.",
  },
  {
    classLevel: 12,
    subject: "Maths",
    title: "Integrals",
    content: "Integration is the reverse of differentiation. The indefinite integral of xⁿ is xⁿ⁺¹/(n+1) + C. Integration by substitution simplifies complex integrals. Integration by parts: ∫u·dv = uv - ∫v·du. Definite integrals have limits and give a numerical value representing the area under a curve. The Fundamental Theorem of Calculus connects differentiation and integration.",
  },
  {
    classLevel: 12,
    subject: "Maths",
    title: "Matrices and Determinants",
    content: "A matrix is a rectangular array of numbers arranged in rows and columns. Types include row matrix, column matrix, square matrix, diagonal matrix, identity matrix, and zero matrix. Matrix operations include addition, subtraction, and multiplication. The determinant of a 2×2 matrix [[a,b],[c,d]] is ad-bc. Inverse of a matrix A exists if det(A) ≠ 0. Cramer's rule uses determinants to solve systems of linear equations.",
  },
  {
    classLevel: 12,
    subject: "Science",
    title: "Electrostatics",
    content: "Electric charge is a fundamental property of matter. Coulomb's law: F = kq₁q₂/r², the force between two point charges is proportional to the product of charges and inversely proportional to the square of the distance. Electric field E = F/q. Electric potential V = kq/r. Gauss's law relates electric flux to enclosed charge. Capacitors store electrical energy; capacitance C = Q/V. Parallel plate capacitor: C = ε₀A/d.",
  },
  {
    classLevel: 12,
    subject: "Science",
    title: "Solutions",
    content: "A solution is a homogeneous mixture of two or more substances. The solute is dissolved in the solvent. Concentration can be expressed as molarity (moles per liter), molality (moles per kg of solvent), mole fraction, and mass percentage. Raoult's law states that the partial vapor pressure of a component equals its mole fraction times its pure vapor pressure. Colligative properties depend on the number of solute particles: boiling point elevation, freezing point depression, osmotic pressure.",
  },
  {
    classLevel: 12,
    subject: "Science",
    title: "Electromagnetic Induction",
    content: "Faraday's law states that a changing magnetic flux through a circuit induces an EMF. The magnitude of induced EMF equals the rate of change of magnetic flux: E = -dΦ/dt. Lenz's law states the induced current opposes the change causing it. Self-induction is the EMF induced in a coil due to change in its own current. Mutual induction occurs between two nearby coils. AC generators work on electromagnetic induction. Transformers step voltage up or down.",
  }
];

// Helper to get embedding
async function getEmbedding(text: string) {
  const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
  const result = await model.embedContent(text);
  return result.embedding.values;
}

async function seedDatabase() {
  console.log("Starting seed process...");
  
  if (!process.env.GEMINI_API_KEY) {
    console.error("Please set GEMINI_API_KEY environment variable");
    process.exit(1);
  }

  for (const chapter of seedData) {
    console.log(`Seeding chapter: ${chapter.title} (Class ${chapter.classLevel} ${chapter.subject})`);
    
    // Insert chapter
    const [insertedChapter] = await db.insert(chaptersTable).values({
      classLevel: chapter.classLevel,
      subject: chapter.subject,
      title: chapter.title,
      content: chapter.content,
    }).returning();

    // Chunking the content - for this demo, we chunk by sentences, but the content is short enough to be a single chunk or two chunks.
    const chunks = chapter.content.match(/[^\.!\?]+[\.!\?]+/g) || [chapter.content];
    
    for (const chunk of chunks) {
      const chunkText = chunk.trim();
      if (!chunkText) continue;

      const embedding = await getEmbedding(chunkText);
      
      await db.insert(chapterChunksTable).values({
        chapterId: insertedChapter.id,
        chunkText,
        embedding: JSON.stringify(embedding), // Stored as JSONB
      });
    }
  }

  console.log("Seeding complete!");
  process.exit(0);
}

seedDatabase().catch((err) => {
  console.error("Error seeding database:", err);
  process.exit(1);
});
