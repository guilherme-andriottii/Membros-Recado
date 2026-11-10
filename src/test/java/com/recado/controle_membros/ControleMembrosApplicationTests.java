package com.recado.controle_membros;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

/*
 * TESTE AUTOMÁTICO (criado pelo Spring Initializr).
 *
 * @SpringBootTest sobe o contexto completo da aplicação. O teste
 * "contextLoads" passa se o Spring conseguir iniciar sem erro.
 *
 * ATENÇÃO: como o application.properties aponta para o PostgreSQL, o banco
 * precisa estar ligado para este teste passar (mvn test).
 */
@SpringBootTest
class ControleMembrosApplicationTests {

	@Test
	void contextLoads() {
		// vazio de propósito: o simples fato de o contexto subir já é o teste
	}

}