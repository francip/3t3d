# Nebula Whisper Particle Effect Presets

This document records the parameter presets used for the Nebula Whisper particle effect in different contexts within the 3D Tic-Tac-Toe game.

## Parameter Configurations

### Common Parameters (Both Boards)
- **Particle Count**: 500
- **Box Size**: 0.42 (containment boundary)
- **Initial Position Z Range**: ±0.15
- **Velocity Range**: ±0.02 (was previously ±0.04)
- **Particle Size Range**: 1.0-3.0
- **Wave Amplitudes**:
  - Primary waves: 0.08 (reduced from 0.15)
  - Secondary waves: 0.04 (reduced from 0.07)
- **Movement Frequencies**:
  - Primary wave frequencies: [1.2, 1.7, 2.3]
  - Secondary wave frequencies: [0.7, 0.9, 1.3]
- **Boundary Behavior**: Soft scaling (0.85) when particles hit boundary

### Distribution Presets
- **Circular Distribution**: Particles form a circular ring pattern
- **Cross Distribution**: Particles tend to follow diagonal paths
- **Default Distribution**: Random placement within volume

### Movement Pattern Presets
- **Wave Pattern**: Complex multifrequency wave motion (default)
- **Orbital Pattern**: Spiral motion with oscillating radius 
- **Diagonal Pattern**: Particles attracted toward diagonals

### Main Board Preset
- **Cell Size**: 0.9
- **Initial Position Radius**: 0.05-0.25
- **Safety Margin**: 0.65
- **Point Size Multiplier**: 18.0 (base) 
- **Effect**: More spread out, creating a full-cell cloud effect
- **Visual Impact**: Particles fill most of the cell space while staying confined

### Miniboard Preset (Turn Indicator & Style Selector)
- **Cell Size**: 0.8
- **Safety Margin**: 0.4 (more aggressively contained)
- **Point Size Multiplier**: 15.0 (reduced from main board)
- **Effect**: More tightly clustered in the center of the cell
- **Visual Impact**: Denser, more concentrated cloud effect

## Configuration Logic

### Main Board
```javascript
// Special handling for Nebula Whisper style on the main board
if (currentStyle === 'nebula-whisper') {
    configureParticleSystemForCell(particles, 0.9, 0.9, 0.42, 0.65);
}
```

### Turn Indicator & Style Preview
```javascript
// For miniboards with Nebula Whisper style
if (style.name === 'nebula-whisper' || isNebulaWhisper) {
    configureParticleSystemForCell(particles, miniCellSize, 0.9, 0.42, 0.4);
} else {
    configureParticleSystemForCell(particles, miniCellSize);
}
```

### Shader Adjustment Logic
The `configureParticleSystemForCell` function applies these adjustments:
1. Scales the entire particle system by the safety margin
2. Overrides the box size in the shader
3. Reduces point size for miniboards

## Example Usage with Player-specific Colors

```javascript
// Create player markers with customized Nebula Whisper effects
function createPlayerMarker(player, position) {
    const playerStyles = {
        player1: {
            color: { primary: [1.0, 0.3, 0.3], secondary: [1.0, 0.1, 0.1] },
            movementPattern: { type: 'diagonal', strength: 0.7 }
        },
        player2: {
            color: { primary: [0.3, 0.4, 1.0], secondary: [0.1, 0.2, 1.0] },
            movementPattern: { type: 'orbital', strength: 0.6 }
        }
    };
    
    return createNebulaWhisperParticleSystem(position, playerStyles[player]);
}
```

## Notes
The intentional difference in appearance between main board and miniboard creates visual interest:
- Main board: More expansive, cloudy effect that fills the cell
- Miniboard: More condensed, focused presentation for the UI elements

This approach maintains the same aesthetic while providing appropriate visual scaling for different contexts.