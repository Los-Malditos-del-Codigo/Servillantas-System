package com.servillantas.rv.autenticacion.security;

import java.util.List;

import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.servillantas.rv.autenticacion.entity.Perfil;
import com.servillantas.rv.autenticacion.repository.PerfilRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsServiceImpl implements CustomUserDetailsService {

	private final PerfilRepository perfilRepository;

	@Override
	public UserDetails loadUserByUsername(String email) {

		Perfil perfil = perfilRepository.findByEmail(email)
				.orElseThrow(() -> new UsernameNotFoundException("No se encontró el perfil"));

		return User.builder().username(perfil.getEmail()).password(perfil.getPasswordHash())
				.authorities(List.of(new SimpleGrantedAuthority("ROLE_" + perfil.getRol().getNombre())))
				.disabled(!perfil.getActivo()).build();
	}
}
