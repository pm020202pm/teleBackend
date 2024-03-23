% Antoine parameters
A_water = 8.07131;
B_water = 1730.63;
C_water = 233.426;

A_ethanol = 8.2133;
B_ethanol = 1652.05;
C_ethanol = 231.48;

% Convert boiling points to Kelvin
T_boiling_water = 373.15-273.15;  % 100'?''?'C
T_boiling_ethanol = 351.38-273.15; % 78.23'?''?'C

% Temperature range for plotting
T_range = linspace(T_boiling_ethanol, T_boiling_water, 80);

% Calculate vapor pressures for water and ethanol
P_water = 10.^(A_water - (B_water ./ (T_range + C_water)));
P_ethanol = 10.^(A_ethanol - (B_ethanol ./ (T_range + C_ethanol)));

% Calculate liquid phase compositions (x) for water and ethanol
x_water =(760-P_ethanol)./(P_water-P_ethanol);
x_ethanol = 1 - x_water; % Total composition is 1

% Calculate vapor phase compositions (y) for water and ethanol
y_water = (x_water.* P_water) / 760; % P_total = 1 atm = 760 mmHg
y_ethanol = (x_ethanol.* P_ethanol) / 760;

% Plot T-x-y diagram
figure(1)
% Water
plot(x_water, T_range);
hold on
plot(y_water, T_range);
figure(2)
% Ethanol
plot(x_ethanol, T_range);
hold on
plot(y_ethanol, T_range);