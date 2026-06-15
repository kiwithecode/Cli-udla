# Casos de uso (entrada opcional)

Dejá acá los casos de prueba que querés que `udla-qa analizar` use como base.

- **Es opcional.** Si esta carpeta está vacía, el agente genera los casos automáticamente explorando la web (o te pide que los describas).
- **Formatos aceptados:** `.md`, `.csv`, `.feature` (Gherkin), `.txt` o lo que prefieras. El agente los lee y los interpreta.
- El binario lee esta carpeta del **directorio donde ejecutás** `udla-qa`.

## Ejemplo (`login.md`)

```md
# CU-01 Login con credenciales válidas
1. Ir a /login
2. Ingresar usuario y contraseña válidos
3. Click en "Ingresar"
Resultado esperado: redirige al dashboard y muestra el nombre del usuario.

# CU-02 Login con contraseña inválida
1. Ir a /login
2. Ingresar usuario válido y contraseña incorrecta
3. Click en "Ingresar"
Resultado esperado: muestra mensaje de error y permanece en /login.
```

## Ejemplo (`busqueda.feature`)

```gherkin
Feature: Búsqueda de productos
  Scenario: Buscar un producto existente
    Given estoy en la home
    When busco "notebook"
    Then veo resultados que contienen "notebook"
```
