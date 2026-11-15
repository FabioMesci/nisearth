# AGENTS.md - Directrices para Asistentes de IA

## 🎯 Propósito del Proyecto
Este repositorio (**dancing_with_sars**) gestiona un pipeline de análisis de datos geoespaciales/riesgos (incluyendo módulos InSAR) y una interfaz web asociada.

## 🛠️ Stack Tecnológico y Entorno
- **Backend / Pipeline:** Python (Pandas, scripts modulares en `pipeline/`).
- **Frontend / Web:** React / Node.js (`web/`).
- **Control de Versiones:** Git.

## 📋 Reglas de Desarrollo para Agentes
1. **Precisión Técnica:** No introduzcas dependencias externas nuevas a menos que sea estrictamente necesario y se actualice el gestor de paquetes correspondiente.
2. **Mantenibilidad:** Respeta la separación de responsabilidades entre los scripts de extracción/procesamiento (`pipeline/`) y la capa visual (`web/`).
3. **Manejo de Errores:** Asegúrate de que cualquier bloque de código nuevo incluya validaciones robustas y gestión de excepciones clara, especialmente en el tratamiento de datos espaciales.