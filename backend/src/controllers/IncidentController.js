const connection = require('../database/connection');

module.exports = {
  async index (request, response) {
    const { page = 1 } = request.query;

    // Pegar a 1º posição do array [count] é igual a count[0]
    const [count] = await connection('incidents').count()

    console.log(count);

    const incidents = await connection('incidents')
      .join('ongs', 'ongs.id', '=', 'incidents.ong_id')
      .limit(5)
      .offset((page - 1) * 5)
      .select([
        'incidents.*',
        'ongs.name',
        'ongs.email',
        'ongs.whatsapp',
        'ongs.city',
        'ongs.uf'
      ]);

    response.header('X-Total-Count', count['count(*)']);
  
    return response.json(incidents);
  },

  async create(request, response) {
    // DESESTRUTURALIZACAO
    const {
      title,
      description,
      value
    } = request.body;

    const ong_id = request.headers.authorization;

    // A primeira chave do array será armazenada numa chave chamada id
    const [id] = await connection('incidents').insert({
      title,
      description,
      value,
      ong_id,
    })

    return response.json({ id });
  },

  async delete(request, response) {
    const { id } = request.params;
    const ong_id = request.headers.authorization;

    const incident = await connection('incidents')
      .where('id', id)
      .select('ong_id')
      .first();

    if (incident.ong_id !== ong_id) {
      // Retorna resposta de erro de autorização
      return response.status(401).json({ error: 'Operation not permitted.' });
    }

    await connection('incidents').where('id', id).delete();

    // Retorna resposta de sucesso sem conteudo
    return response.status(204).send();
  }
};